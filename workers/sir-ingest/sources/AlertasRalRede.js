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

const LOG_PREFIX = "[RAL]";
const RAL_NUM_PATTERN = /^RAL-\d+\/\d{4}$/i;
const RAL_ROW_SELECTOR = 'tbody > tr[class*="listaLinha"]';

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
      abertura = IF(
        VALUES(abertura) IS NOT NULL AND TRIM(VALUES(abertura)) != '',
        VALUES(abertura),
        abertura
      ),
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

/** Extrai campos de uma linha da snapshot da tabela RAL. */
function parseRalSnapshotRow(row) {
  const { texts, rowTitle, designationTitle, openedAtFromLink, cellCount } = row;
  const numRecup = texts.find((text) => isRalRecord(text))?.trim() ?? "";

  if (!numRecup) {
    throw new Error(`Skipped row — not RAL (${cellCount} columns)`);
  }

  if (cellCount < 8) {
    throw new Error(`Skipped row — incomplete RAL (${cellCount} columns)`);
  }

  const openedAt = texts[4] || openedAtFromLink || "";

  return {
    numRecup,
    designation: designationTitle || texts[0] || "",
    type: texts[1] || "",
    anomalyCode: texts[2] || "",
    openedAt,
    duration: texts[5] || "",
    executorCf: texts[7] || "",
    details: rowTitle || null,
  };
}

/** Processa linhas da tabela RAL, persiste no banco e detecta encerramentos. */
async function processRalTable(page, seenItems) {
  const tableFrame = await prepareScrapeTable(page, config.elementTimeoutMs);
  let snapshot;
  try {
    snapshot = await scrapeListaTableSnapshot(tableFrame, RAL_ROW_SELECTOR);
  } catch (err) {
    if (isFrameDetachedError(err)) {
      throw new Error("Frame was detached while reading RAL table snapshot");
    }
    throw err;
  }

  const currentIds = [];
  let hasNewItems = false;
  let rowErrors = 0;

  for (const row of snapshot) {
    try {
      const ral = parseRalSnapshotRow(row);
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
