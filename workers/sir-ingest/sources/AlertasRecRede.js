import {
  assertCredentials,
  getDbConnection,
  isFrameDetachedError,
  loadBaseConfig,
  loadSeenItems,
  logCycleSummary,
  prepareScrapeTable,
  processRecordClosures,
  runWithRetry,
  saveErrorPageHtml,
  saveSeenItems,
  scrapeListaTableSnapshot,
  SirBrowserSession,
  startPollingLoop,
  submitRecordTypeFilter,
} from "./lib/sir-scraper-common.js";

const LOG_PREFIX = "[REC]";
const REC_ROW_SELECTOR = "tbody > tr";

const config = loadBaseConfig({
  seenItemsFile: "states/dadosAntigosREC.json",
  activeIdsFile: "states/recsAtivas.json",
  tableStateFile: "states/estadoTabelaRec.json",
  recordType: "REC/DSR/TCQ",
  table: "recs",
});

assertCredentials(config);

const session = new SirBrowserSession(config);

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

/** Indica registro REC/DSR/TCQ pelo prefixo do num_recup. */
function isRecGroupRecord(numRecup) {
  return /^(REC|DSR|TCQ)-\d+\/\d{4}$/i.test(String(numRecup || "").trim());
}

/** Extrai campos de uma linha da snapshot da tabela REC/DSR/TCQ. */
function parseRecSnapshotRow(row) {
  const { texts, rowTitle, cellCount } = row;
  if (cellCount < 7) {
    throw new Error(`Incomplete REC row (${cellCount} columns, expected >= 7)`);
  }

  const numRecup = texts[2] || "";
  if (!isRecGroupRecord(numRecup)) {
    throw new Error(`Skipped row — not REC/DSR/TCQ (${numRecup || "empty"})`);
  }

  return {
    numRecup,
    priority: texts[0] || "",
    points: texts[1] || "",
    client: texts[3] || "",
    designation: texts[4] || "",
    openedAt: texts[5] || "",
    executorCf: texts[6] || "",
    detailsTitle: rowTitle || null,
  };
}

/** Processa linhas da tabela REC, persiste no banco e detecta encerramentos. */
async function processRecTable(page, seenItems) {
  const tableFrame = await prepareScrapeTable(page, config.elementTimeoutMs);
  let snapshot;
  try {
    snapshot = await scrapeListaTableSnapshot(tableFrame, REC_ROW_SELECTOR);
  } catch (err) {
    if (isFrameDetachedError(err)) {
      throw new Error("Frame was detached while reading REC table snapshot");
    }
    throw err;
  }

  const currentIds = [];
  let hasNewItems = false;
  let rowErrors = 0;

  for (const row of snapshot) {
    try {
      const rec = parseRecSnapshotRow(row);
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

/** Executa ciclo de scrape REC (reutiliza sessão; reloga só se necessário). */
async function runRecCycle({ startedAt }) {
  const seenItems = loadSeenItems(config.seenItemsFile);
  let tableStats = { active: 0, rowErrors: 0 };

  try {
    await runWithRetry(
      async () => {
        const page = await session.ensurePage();
        await submitRecordTypeFilter(page, config.recordType, config.elementTimeoutMs);
        tableStats = await processRecTable(page, seenItems);
      },
      {
        maxRetries: config.maxRetries,
        logPrefix: LOG_PREFIX,
        onRetryError: async () => session.invalidate(),
        onFinalError: async () => {
          if (session.page) await saveErrorPageHtml(session.page, "REC");
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
  runCycle: runRecCycle,
  onShutdown: () => session.dispose(),
});
