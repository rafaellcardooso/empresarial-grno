/**
 * Utilitários compartilhados dos scrapers SIR (RAL/REC) com Playwright.
 */
import { chromium } from "playwright";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let dbConnection = null;
let isCycleRunning = false;

const SAVE_ERROR_HTML = process.env.SAVE_SCRAPE_ERROR_HTML !== "false";
const MAX_ERROR_DUMPS = Number.parseInt(process.env.MAX_SCRAPE_ERROR_DUMPS || "5", 10);

/** Carrega configuração base do worker com overrides opcionais. */
export function loadBaseConfig(overrides = {}) {
  return {
    credentials: {
      username: process.env.SISTEMA_USUARIO,
      password: process.env.SISTEMA_SENHA,
    },
    systemUrl: process.env.SISTEMA_URL || "http://10.53.224.155/index.cfm?nofoc=yes",
    pollIntervalMs: process.env.INTERVALO_MONITORAMENTO
      ? parseInt(process.env.INTERVALO_MONITORAMENTO, 10)
      : 300000,
    maxRetries: 3,
    elementTimeoutMs: 15000,
    emptyCyclesBeforeClose: process.env.CICLOS_VAZIOS_PARA_ENCERRAR
      ? parseInt(process.env.CICLOS_VAZIOS_PARA_ENCERRAR, 10)
      : 2,
    ...overrides,
  };
}

/** Valida presença de credenciais SISTEMA_USUARIO e SISTEMA_SENHA. */
export function assertCredentials(config) {
  if (!config.credentials?.username || !config.credentials?.password) {
    throw new Error("Missing SISTEMA_USUARIO or SISTEMA_SENHA.");
  }
}

/** Lê JSON de disco ou retorna fallback em caso de ausência ou erro. */
export function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`[SIR] Failed to read ${filePath}:`, err.message);
    return fallback;
  }
}

/** Grava objeto JSON em disco, criando diretórios pais se necessário. */
export function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data), "utf8");
}

/** Carrega conjunto de itens já vistos a partir de arquivo JSON. */
export function loadSeenItems(filePath) {
  const raw = readJsonFile(filePath, []);
  return new Set(Array.isArray(raw) ? raw : []);
}

/** Persiste conjunto de itens vistos em arquivo JSON. */
export function saveSeenItems(filePath, items) {
  writeJsonFile(filePath, Array.from(items));
}

/** Carrega lista de IDs ativos do ciclo anterior. */
export function loadActiveIds(filePath) {
  const raw = readJsonFile(filePath, []);
  return Array.isArray(raw) ? raw : [];
}

/** Persiste lista de IDs ativos do ciclo atual. */
export function saveActiveIds(filePath, ids) {
  writeJsonFile(filePath, ids);
}

/** Carrega estado da tabela (vazia e ciclos consecutivos vazios). */
export function loadTableState(filePath) {
  const data = readJsonFile(filePath, {});
  return {
    isEmpty: data.isEmpty ?? data.tabelaVazia ?? data.tabelaVaziaAnterior ?? null,
    consecutiveEmptyCycles: data.consecutiveEmptyCycles ?? data.ciclosVaziosConsecutivos ?? 0,
  };
}

/** Persiste estado da tabela entre ciclos de scrape. */
export function saveTableState(filePath, state) {
  writeJsonFile(filePath, {
    isEmpty: state.isEmpty,
    consecutiveEmptyCycles: state.consecutiveEmptyCycles,
  });
}

/** Monta configuração MySQL SIR a partir de SIR_DB_*. */
function getSirDbConfig() {
  const user = process.env.SIR_DB_USER;
  const password = process.env.SIR_DB_PASSWORD;
  if (!user || !password) {
    throw new Error("Missing SIR_DB_USER or SIR_DB_PASSWORD in worker .env");
  }

  return {
    host: process.env.SIR_DB_HOST || "127.0.0.1",
    port: Number(process.env.SIR_DB_PORT || 3306),
    user,
    password,
    database: process.env.SIR_DB_NAME || "claroEmpresarial",
  };
}

/** Retorna conexão MySQL SIR, reconectando se o ping falhar. */
export async function getDbConnection() {
  if (dbConnection) {
    try {
      await dbConnection.ping();
      return dbConnection;
    } catch (err) {
      console.warn("[SIR] MySQL ping failed — reconnecting:", err.message);
      await resetDbConnection();
    }
  }

  dbConnection = await mysql.createConnection(getSirDbConfig());
  console.log("[SIR] MySQL connection established.");
  return dbConnection;
}

/** Encerra e descarta a conexão MySQL em cache. */
export async function resetDbConnection() {
  if (dbConnection) {
    try {
      await dbConnection.end();
    } catch {
      /* ignore */
    }
    dbConnection = null;
  }
}

/** Atualiza registro para status ENCERRADO no banco. */
export async function markRecordClosed(table, recordId, logPrefix) {
  const id = String(recordId).trim();
  const connection = await getDbConnection();
  const [result] = await connection.execute(
    `UPDATE ${table} SET status = 'ENCERRADO', ultima_atualizacao = NOW() WHERE num_recup = ?`,
    [id],
  );
  if (result.affectedRows > 0) {
    console.log(`${logPrefix} ${id} marked as closed.`);
  } else {
    console.warn(`${logPrefix} No active record to close: ${id}`);
  }
}

/** Encerra registros ausentes no scrape; tabela vazia exige ciclos consecutivos confirmados. */
export async function processRecordClosures({
  currentIds,
  activeIdsFile,
  tableStateFile,
  table,
  logPrefix,
  emptyCyclesBeforeClose,
}) {
  const state = loadTableState(tableStateFile);
  const previousIds = loadActiveIds(activeIdsFile);

  if (currentIds.length === 0) {
    state.consecutiveEmptyCycles += 1;
    state.isEmpty = true;

    const shouldCloseAll =
      state.consecutiveEmptyCycles >= emptyCyclesBeforeClose && previousIds.length > 0;

    if (shouldCloseAll) {
      console.log(
        `${logPrefix} Empty table for ${state.consecutiveEmptyCycles} cycles — closing ${previousIds.length} record(s).`,
      );
      for (const id of previousIds) {
        await markRecordClosed(table, id, logPrefix);
      }
      saveActiveIds(activeIdsFile, []);
      state.consecutiveEmptyCycles = 0;
    } else if (previousIds.length > 0) {
      console.log(
        `${logPrefix} Empty table (${state.consecutiveEmptyCycles}/${emptyCyclesBeforeClose}) — waiting for confirmation.`,
      );
    }

    saveTableState(tableStateFile, state);
    return;
  }

  state.isEmpty = false;
  state.consecutiveEmptyCycles = 0;
  saveTableState(tableStateFile, state);

  const closedIds = previousIds.filter((id) => !currentIds.includes(id));
  if (closedIds.length > 0) {
    console.log(`${logPrefix} Closed/moved: ${closedIds.join(", ")}`);
    for (const id of closedIds) {
      await markRecordClosed(table, id, logPrefix);
    }
  }

  saveActiveIds(activeIdsFile, currentIds);
}

/** Aguarda frame nomeado ficar disponível na página. */
async function waitForFrame(page, frameName, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const frame = page.frame({ name: frameName });
    if (frame) return frame;
    await page.waitForTimeout(200);
  }
  throw new Error(`Frame not found: ${frameName}`);
}

/** Seleciona tipo de registro no filtro SIR e confirma. */
export async function submitRecordTypeFilter(page, recordType, timeoutMs) {
  page.setDefaultTimeout(timeoutMs);
  await waitForFrame(page, "frameNivel1Principal", timeoutMs);
  const filterFrame = await waitForFrame(page, "frameFiltro", timeoutMs);
  await filterFrame
    .locator('select[name="indic_tipo_recup"]')
    .selectOption({ label: recordType });
  await filterFrame.locator('[name="confirma"]').click();
}

/** Navega frames aninhados até o frame da tabela de itens. */
export async function getTableFrame(page, timeoutMs) {
  page.setDefaultTimeout(timeoutMs);
  await waitForFrame(page, "frameNivel1Principal", timeoutMs);
  await waitForFrame(page, "framesetNivel2ListaDeTarefas", timeoutMs);
  await waitForFrame(page, "frameNivel3ItensRecebidos", timeoutMs);
  return waitForFrame(page, "frameNivel2ItensRecebidosPrincipal", timeoutMs);
}

/** Inicia Chromium headless e retorna browser com página configurada. */
export async function createBrowser() {
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  return { browser, page };
}

/** Fecha instância do browser ignorando erros de shutdown. */
export async function disposeBrowser(browser) {
  if (browser) {
    try {
      await browser.close();
    } catch (err) {
      console.error("[SIR] Failed to close browser:", err.message);
    }
  }
}

/** Autentica no SIR e retorna a página da aplicação aberta em nova aba. */
export async function performLogin(page, credentials, timeoutMs) {
  page.setDefaultTimeout(timeoutMs);
  await page.locator('[name="usuario"]').fill(credentials.username);
  await page.locator('[name="senha"]').fill(credentials.password);

  const popupPromise = page.context().waitForEvent("page", { timeout: 20000 });
  await page.locator('[name="Entrar"]').click();

  const appPage = await popupPromise;
  appPage.setDefaultTimeout(timeoutMs);
  appPage.setDefaultNavigationTimeout(30000);
  await appPage.waitForLoadState("domcontentloaded");
  return appPage;
}

/** Remove dumps HTML antigos além do limite configurado. */
function pruneErrorDumps(dir, maxKeep) {
  if (!fs.existsSync(dir) || maxKeep < 1) return;

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".html"))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(dir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files.slice(maxKeep)) {
    fs.unlinkSync(path.join(dir, file.name));
  }
}

/** Salva HTML da página atual em states/error/ para diagnóstico de falha. */
export async function saveErrorPageHtml(page, prefix) {
  if (!SAVE_ERROR_HTML) {
    console.error(`[SIR] Scrape failed (${prefix}). HTML dump disabled (SAVE_SCRAPE_ERROR_HTML=false).`);
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join("states", "error", `error_page_${prefix}_${timestamp}.html`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, await page.content());
    pruneErrorDumps(path.dirname(filePath), MAX_ERROR_DUMPS);
    console.error(`[SIR] Error HTML saved to ${filePath} (keeping last ${MAX_ERROR_DUMPS})`);
  } catch (err) {
    console.error("[SIR] Failed to save error HTML:", err.message);
  }
}

/** Emite log JSON estruturado com resumo do ciclo de scrape. */
export function logCycleSummary(logPrefix, summary) {
  const payload = {
    event: "scrape_cycle",
    at: new Date().toISOString(),
    ...summary,
  };
  console.log(`${logPrefix} ${JSON.stringify(payload)}`);
}

/** Extrai texto visível de célula da tabela SIR (font interno ou innerText). */
export async function getCellText(cell) {
  const font = cell.locator("font.listaCelulaFont");
  if ((await font.count()) > 0) {
    return (await font.first().innerText()).trim();
  }
  return (await cell.innerText()).trim();
}

/** Extrai atributo title de link ou linha para detalhes do registro. */
export async function extractTitleFromRow(row, cellIndex = 0) {
  const cell = row.locator("td").nth(cellIndex);
  const link = cell.locator("a");
  if ((await link.count()) > 0) {
    const title = await link.first().getAttribute("title");
    if (title?.trim()) return title.trim();
  }
  const rowTitle = await row.getAttribute("title");
  return rowTitle?.trim() || null;
}

/** Registra handlers SIGTERM/SIGINT para encerramento gracioso do worker. */
export function registerGracefulShutdown(onShutdown) {
  const handler = async () => {
    console.log("[SIR] SIGTERM received — shutting down...");
    await onShutdown?.();
    await resetDbConnection();
    process.exit(0);
  };
  process.on("SIGTERM", handler);
  process.on("SIGINT", handler);
}

/** Agenda ciclos periódicos de scrape com proteção contra overlap. */
export function startPollingLoop({ logPrefix, pollIntervalMs, runCycle }) {
  registerGracefulShutdown(resetDbConnection);

  /** Executa um ciclo de scrape ou ignora se o anterior ainda estiver em andamento. */
  async function tick() {
    if (isCycleRunning) {
      console.warn(`${logPrefix} Previous cycle still running — skipping schedule.`);
      scheduleNext();
      return;
    }

    isCycleRunning = true;
    const startedAt = Date.now();
    try {
      await getDbConnection();
      await runCycle({ logPrefix, startedAt });
    } catch (err) {
      console.error(`${logPrefix} Cycle error:`, err.message);
      await resetDbConnection();
    } finally {
      isCycleRunning = false;
      scheduleNext();
    }
  }

  /** Agenda próximo ciclo após o intervalo configurado. */
  function scheduleNext() {
    setTimeout(tick, pollIntervalMs);
  }

  console.log(`${logPrefix} Starting monitor (interval ${pollIntervalMs / 1000}s)...`);
  tick();
}

/** Executa função com retentativas e callback opcional na falha final. */
export async function runWithRetry(fn, { maxRetries, logPrefix, onFinalError }) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`${logPrefix} Attempt ${attempt + 1}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  await onFinalError?.(lastError);
  throw lastError;
}
