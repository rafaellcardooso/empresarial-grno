import {
  assertCredentials,
  createBrowser,
  disposeBrowser,
  extractTitleFromRow,
  getCellText,
  getDbConnection,
  getTableFrame,
  loadBaseConfig,
  loadSeenItems,
  logCycleSummary,
  performLogin,
  processRecordClosures,
  runWithRetry,
  saveErrorPageHtml,
  saveSeenItems,
  startPollingLoop,
  submitRecordTypeFilter,
} from "./lib/sir-scraper-common.js";

const LOG_PREFIX = "[REC]";

const config = loadBaseConfig({
  seenItemsFile: "states/dadosAntigosREC.json",
  activeIdsFile: "states/recsAtivas.json",
  tableStateFile: "states/estadoTabelaRec.json",
  recordType: "REC",
  table: "recs",
});

assertCredentials(config);

/** Insere ou atualiza REC ativa no MySQL. */
async function upsertRec(rec) {
  const connection = await getDbConnection();
  const sql = `
    INSERT INTO recs (
      num_recup, prioridade, pontos, cliente, designacao,
      abertura, cf_executante, status, ultima_atualizacao, detalhes_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO', NOW(), ?)
    ON DUPLICATE KEY UPDATE
      prioridade = VALUES(prioridade),
      pontos = VALUES(pontos),
      cliente = VALUES(cliente),
      designacao = VALUES(designacao),
      abertura = VALUES(abertura),
      cf_executante = VALUES(cf_executante),
      ultima_atualizacao = NOW(),
      status = 'ATIVO',
      detalhes_title = IF(VALUES(detalhes_title) IS NOT NULL AND VALUES(detalhes_title) != '', VALUES(detalhes_title), detalhes_title)
  `;

  await connection.execute(sql, [
    rec.numRecup,
    rec.priority,
    rec.points,
    rec.client,
    rec.designation,
    rec.openedAt,
    rec.executorCf,
    rec.detailsTitle,
  ]);
}

/** Extrai campos de uma linha da tabela REC/DSR no SIR. */
async function parseRecRow(row) {
  const cells = row.locator("td");
  const cellCount = await cells.count();
  if (cellCount < 7) {
    throw new Error(`Incomplete REC row (${cellCount} columns, expected >= 7)`);
  }

  const numRecup = await getCellText(cells.nth(2));
  if (!/^(REC|DSR)-/.test(numRecup) && !/\d+\/\d+/.test(numRecup)) {
    throw new Error("Skipped row — not a REC/DSR");
  }

  const detailsTitle = await extractTitleFromRow(row, 0);

  return {
    numRecup,
    priority: await getCellText(cells.nth(0)),
    points: await getCellText(cells.nth(1)),
    client: await getCellText(cells.nth(3)),
    designation: await getCellText(cells.nth(4)),
    openedAt: await getCellText(cells.nth(5)),
    executorCf: await getCellText(cells.nth(6)),
    detailsTitle,
  };
}

/** Processa linhas da tabela REC, persiste no banco e detecta encerramentos. */
async function processRecTable(page, seenItems) {
  const tableFrame = await getTableFrame(page, config.elementTimeoutMs);
  const rows = tableFrame.locator("table.listaTable tbody tr");
  const rowCount = await rows.count();

  const currentIds = [];
  let hasNewItems = false;
  let rowErrors = 0;

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    try {
      const rec = await parseRecRow(row);
      currentIds.push(rec.numRecup);
      const itemKey = `${config.recordType}:${rec.numRecup} | ${rec.client}`;

      if (!seenItems.has(itemKey)) {
        seenItems.add(itemKey);
        hasNewItems = true;
        console.log(`${LOG_PREFIX} New REC: ${rec.numRecup}`);
      }

      await upsertRec(rec);
    } catch (err) {
      if (!err.message.includes("Skipped row")) {
        rowErrors += 1;
        console.warn(`${LOG_PREFIX} Row parse error:`, err.message);
      }
    }
  }

  if (hasNewItems) saveSeenItems(config.seenItemsFile, seenItems);

  await processRecordClosures({
    currentIds,
    activeIdsFile: config.activeIdsFile,
    tableStateFile: config.tableStateFile,
    table: config.table,
    logPrefix: LOG_PREFIX,
    emptyCyclesBeforeClose: config.emptyCyclesBeforeClose,
  });

  return { active: currentIds.length, rowErrors };
}

/** Executa ciclo completo de scrape REC (login, filtro, tabela, resumo). */
async function runRecCycle({ startedAt }) {
  let browser;
  let page;
  const seenItems = loadSeenItems(config.seenItemsFile);
  let tableStats = { active: 0, rowErrors: 0 };

  try {
    ({ browser, page } = await createBrowser());
    await page.goto(config.systemUrl, { waitUntil: "domcontentloaded" });
    page = await performLogin(page, config.credentials, config.elementTimeoutMs);

    await runWithRetry(
      async () => {
        await submitRecordTypeFilter(page, config.recordType, config.elementTimeoutMs);
        tableStats = await processRecTable(page, seenItems);
      },
      {
        maxRetries: config.maxRetries,
        logPrefix: LOG_PREFIX,
        onFinalError: async () => saveErrorPageHtml(page, "REC"),
      },
    );

    logCycleSummary(LOG_PREFIX, {
      recordType: config.recordType,
      status: "ok",
      active: tableStats.active,
      rowErrors: tableStats.rowErrors,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    logCycleSummary(LOG_PREFIX, {
      recordType: config.recordType,
      status: "error",
      error: err.message,
      durationMs: Date.now() - startedAt,
    });
    throw err;
  } finally {
    await disposeBrowser(browser);
  }
}

startPollingLoop({
  logPrefix: LOG_PREFIX,
  pollIntervalMs: config.pollIntervalMs,
  runCycle: runRecCycle,
});
