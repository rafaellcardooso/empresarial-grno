/**
 * Cria diretórios de runtime do Playwright (tmp + browsers) fora de /tmp.
 * Usado por `npm run setup:runtime` e antes de `install:browsers`.
 */
import { ensurePlaywrightRuntime } from "../sources/lib/sir-scraper-common.js";

ensurePlaywrightRuntime();
console.log(`[SIR] TMPDIR=${process.env.TMPDIR}`);
console.log(`[SIR] PLAYWRIGHT_BROWSERS_PATH=${process.env.PLAYWRIGHT_BROWSERS_PATH}`);
