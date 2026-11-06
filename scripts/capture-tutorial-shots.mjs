/**
 * Captura prints do tutorial em chamados reais.
 * Uso:
 *   TUTORIAL_BASE=http://192.168.95.40/empresarial \
 *   TUTORIAL_USER=F104262 TUTORIAL_PASS='...' \
 *   node scripts/capture-tutorial-shots.mjs
 *
 * Padrão: portal de produção/lab na rede (192.168.95.40).
 * Do WSL essa origem pode retornar 403 — rode no host com acesso HTTP.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../workers/sir-ingest/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "public/assets/img/tutorial");
const base = (process.env.TUTORIAL_BASE || "http://192.168.95.40/empresarial").replace(/\/$/, "");
const loginUser = process.env.TUTORIAL_USER || "F104263";
const loginPass = process.env.TUTORIAL_PASS || "Tutorial1a";

/** Garante diretório de saída. */
function ensureOutDir() {
  fs.mkdirSync(outDir, { recursive: true });
}

/** Salva screenshot da viewport ou de um seletor. */
async function shot(page, name, selector) {
  const file = path.join(outDir, name);
  if (selector) {
    const loc = page.locator(selector).first();
    if ((await loc.count()) > 0) {
      await loc.screenshot({ path: file }).catch(async () => {
        await page.screenshot({ path: file });
      });
      console.log(`[shots] ${name} (${selector})`);
      return;
    }
  }
  await page.screenshot({ path: file });
  console.log(`[shots] ${name}`);
}

/** Login no portal. */
async function login(page) {
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[type='password']", { timeout: 15000 });
  console.log(`[shots] base=${base} user=${loginUser}`);
  const userInput = page.locator("input[autocomplete='username'], input[type='text']").first();
  await userInput.fill(loginUser);
  await page.locator("input[type='password']").fill(loginPass);
  await page.locator("button[type='submit']").click();
  await page.waitForTimeout(2000);
  if (page.url().includes("/login")) {
    throw new Error(`Login falhou em ${base} — defina TUTORIAL_USER / TUTORIAL_PASS`);
  }
}

/** Completa modal de região se aparecer. */
async function dismissRegionSetupIfAny(page) {
  if ((await page.locator("#region-setup-title").count()) === 0) return;
  await page.selectOption("#region-setup-home-uf", "MA");
  for (const uf of ["MA", "AM", "PA", "AP"]) {
    const box = page.locator(`#region-setup-alert-${uf}`);
    if ((await box.count()) && !(await box.isChecked())) await box.check();
  }
  await page.locator(".region-setup-modal__footer button[type='submit']").click();
  await page.waitForTimeout(1000);
}

/** Clica no primeiro Tratar visível. */
async function clickTreat(page) {
  const btn = page.getByRole("button", { name: /^Tratar$/i }).first();
  if ((await btn.count()) === 0) {
    const link = page.getByRole("link", { name: /^Tratar$/i }).first();
    if ((await link.count()) === 0) return false;
    await link.click();
  } else {
    await btn.click();
  }
  await page.waitForTimeout(1500);
  return true;
}

/** Tenta abrir acionamento e fotografar; fecha sem salvar. */
async function captureAcionamento(page, fileName) {
  const acionar = page
    .getByRole("button", { name: /Acionar|Registrar acionamento|Acionamento/i })
    .first();
  if ((await acionar.count()) === 0) {
    await shot(page, fileName);
    return;
  }
  await acionar.click();
  await page.waitForTimeout(1000);
  await shot(page, fileName, ".modal.show, [role='dialog'].show, .shell-drawer.show");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
}

/** Libera tratativa se o botão existir. */
async function releaseIfPossible(page) {
  const liberar = page.getByRole("button", { name: /^Liberar$/i }).first();
  if ((await liberar.count()) > 0) {
    await liberar.click();
    await page.waitForTimeout(800);
  } else {
    await page.keyboard.press("Escape");
  }
}

/** Fluxo lista → painel → acionamento → liberar. */
async function captureFlow(page, listPath, files) {
  await page.goto(`${base}${listPath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, files.lista);

  const opened = await clickTreat(page);
  if (!opened) {
    console.warn(`[shots] sem Tratar em ${listPath}`);
    await shot(page, files.painel);
    await shot(page, files.acionamento);
    await shot(page, files.concluir);
    return;
  }

  await shot(page, files.painel, ".shell-drawer.show, .offcanvas.show");
  await captureAcionamento(page, files.acionamento);
  await shot(page, files.concluir, ".shell-drawer.show, .offcanvas.show");
  await releaseIfPossible(page);
}

/** Executa capturas. */
async function main() {
  ensureOutDir();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await login(page);
  await dismissRegionSetupIfAny(page);

  // Lista geral (sem filtro SLA) + detalhe de um RAL real
  await page.goto(`${base}/sir/rals`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "overview-tratar.png");

  await captureFlow(page, "/sir/rals?q=RAL-157264", {
    lista: "sir-01-lista.png",
    painel: "sir-02-painel.png",
    acionamento: "sir-03-acionamento.png",
    concluir: "sir-04-concluir.png",
  });

  await captureFlow(page, "/bsod", {
    lista: "bsod-01-lista.png",
    painel: "bsod-02-acionamento.png",
    acionamento: "bsod-03-validacao.png",
    concluir: "bsod-04-concluir.png",
  });

  await captureFlow(page, "/sdh", {
    lista: "sdh-01-lista.png",
    painel: "sdh-02-painel.png",
    acionamento: "sdh-03-acionamento.png",
    concluir: "sdh-04-concluir.png",
  });

  await browser.close();
  console.log(`[shots] done → ${outDir}`);
}

main().catch((err) => {
  console.error("[shots] FAILED:", err);
  process.exit(1);
});
