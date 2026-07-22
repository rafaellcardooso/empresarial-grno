import {
  assertCredentials,
  extractRalDetailsFromRow,
  getCellText,
  getDesignationFromCell,
  getDbConnection,
  getTableFrame,
  loadBaseConfig,
  loadSeenItems,
  logCycleSummary,
  processRecordClosures,
  runWithRetry,
  saveErrorPageHtml,
  saveSeenItems,
  SirBrowserSession,
  startPollingLoop,
  submitRecordTypeFilter,
  waitForScrapeTable,
} from "./lib/sir-scraper-common.js";

const LOG_PREFIX = "[RAL]";
const RAL_NUM_PATTERN = /^RAL-\d+\/\d{4}$/i;

const config = loadBaseConfig({
  seenItemsFile: "states/dadosAntigosRal.json",
  activeIdsFile: "states/ralsAtivas.json",
  tableStateFile: "states/estadoTabelaRal.json",
  recordType: "RAL",
  table: "rals",
});

assertCredentials(config);

const session = new SirBrowserSession(config);

/** Insere ou atualiza RAL ativa no MySQL. */
async function upsertRal(ral) {
  const connection = await getDbConnection();
  const sql = `
    INSERT INTO rals (
      num_recup, descricao, tipo_ral, codigo_anormalidade,
      abertura, duracao, cf_executante, status, ultima_atualizacao, detalhes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO', NOW(), ?)
    ON DUPLICATE KEY UPDATE
      descricao = VALUES(descricao),
      tipo_ral = VALUES(tipo_ral),
      codigo_anormalidade = VALUES(codigo_anormalidade),
      abertura = VALUES(abertura),
      duracao = VALUES(duracao),
      cf_executante = VALUES(cf_executante),
      ultima_atualizacao = NOW(),
      status = 'ATIVO',
      detalhes = IF(
        VALUES(detalhes) IS NOT NULL AND TRIM(VALUES(detalhes)) != '',
        VALUES(detalhes),
        detalhes
      )
  `;

  await connection.execute(sql, [
    ral.numRecup,
    ral.designation,
    ral.type,
    ral.anomalyCode,
    ral.openedAt,
    ral.duration,
    ral.executorCf,
    ral.details,
  ]);
}

/** Indica registro RAL pelo prefixo do num_recup. */
function isRalRecord(numRecup) {
  return RAL_NUM_PATTERN.test(String(numRecup || "").trim());
}

/** Localiza num_recup RAL entre as células da linha. */
async function findRalNumRecupInRow(row) {
  const cells = row.locator("td");
  const cellCount = await cells.count();

  for (let index = 0; index < cellCount; index += 1) {
    const text = await getCellText(cells.nth(index));
    if (isRalRecord(text)) {
      return { numRecup: text.trim() };
    }
  }

  return null;
}

/** Extrai campos de uma linha da tabela RAL no SIR. */
async function parseRalRow(row) {
  const cells = row.locator("td");
  const cellCount = await cells.count();
  const ralMatch = await findRalNumRecupInRow(row);

  if (!ralMatch) {
    throw new Error(`Skipped row — not RAL (${cellCount} columns)`);
  }

  if (cellCount < 8) {
    throw new Error(`Skipped row — incomplete RAL (${cellCount} columns)`);
  }

  return {
    numRecup: ralMatch.numRecup,
    designation: await getDesignationFromCell(cells.nth(0)),
    type: await getCellText(cells.nth(1)),
    anomalyCode: await getCellText(cells.nth(2)),
    openedAt: await getCellText(cells.nth(4)),
    duration: await getCellText(cells.nth(5)),
    executorCf: await getCellText(cells.nth(7)),
    details: await extractRalDetailsFromRow(row),
  };
}

/** Processa linhas da tabela RAL, persiste no banco e detecta encerramentos. */
async function processRalTable(page, seenItems) {
  const tableFrame = await getTableFrame(page, config.elementTimeoutMs);
  await waitForScrapeTable(tableFrame, config.elementTimeoutMs);
  const rows = tableFrame
    .locator("table.listaTable")
    .first()
    .locator('tbody > tr[class*="listaLinha"]');
  const rowCount = await rows.count();

  const currentIds = [];
  let hasNewItems = false;
  let rowErrors = 0;

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    try {
      const ral = await parseRalRow(row);
      if (!ral.numRecup) continue;

      currentIds.push(ral.numRecup);
      const itemKey = `${config.recordType}:${ral.numRecup} | ${ral.designation}`;

      if (!seenItems.has(itemKey)) {
        seenItems.add(itemKey);
        hasNewItems = true;
        console.log(`${LOG_PREFIX} New RAL: ${ral.numRecup}`);
      }

      await upsertRal(ral);
    } catch (err) {
      if (!err.message.includes("Skipped row")) {
        rowErrors += 1;
        console.warn(`${LOG_PREFIX} Row parse error:`, err.message);
      }
    }
  }

  if (hasNewItems) saveSeenItems(config.seenItemsFile, seenItems);

  if (rowErrors === 0) {
    await processRecordClosures({
      currentIds,
      activeIdsFile: config.activeIdsFile,
      tableStateFile: config.tableStateFile,
      table: config.table,
      logPrefix: LOG_PREFIX,
      emptyCyclesBeforeClose: config.emptyCyclesBeforeClose,
    });
  } else {
    console.warn(
      `${LOG_PREFIX} Skipping closures — ${rowErrors} row parse error(s); list may be incomplete.`,
    );
  }

  return { active: currentIds.length, rowErrors };
}

/** Executa ciclo de scrape RAL (reutiliza sessão; reloga só se necessário). */
async function runRalCycle({ startedAt }) {
  const seenItems = loadSeenItems(config.seenItemsFile);
  let tableStats = { active: 0, rowErrors: 0 };

  try {
    await runWithRetry(
      async () => {
        const page = await session.ensurePage();
        await submitRecordTypeFilter(page, config.recordType, config.elementTimeoutMs);
        tableStats = await processRalTable(page, seenItems);
      },
      {
        maxRetries: config.maxRetries,
        logPrefix: LOG_PREFIX,
        onRetryError: async () => session.invalidate(),
        onFinalError: async () => {
          if (session.page) await saveErrorPageHtml(session.page, "RAL");
          await session.invalidate();
        },
      },
    );

    session.markCycleComplete();

    logCycleSummary(LOG_PREFIX, {
      recordType: config.recordType,
      status: "ok",
      active: tableStats.active,
      rowErrors: tableStats.rowErrors,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    await session.invalidate();
    logCycleSummary(LOG_PREFIX, {
      recordType: config.recordType,
      status: "error",
      error: err.message,
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }
}

startPollingLoop({
  logPrefix: LOG_PREFIX,
  pollIntervalMs: config.pollIntervalMs,
  cycleOffsetMs: config.cycleOffsetMs,
  runCycle: runRalCycle,
  onShutdown: () => session.dispose(),
});
