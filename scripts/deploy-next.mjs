#!/usr/bin/env node
/**
 * Executa `next build` e reinicia a unit systemd do Next (prod ou lab).
 *
 * Uso:
 *   npm run deploy:next
 *   npm run deploy:next -- empresarial-next-lab
 */

import { spawnSync } from "node:child_process";

const CANDIDATE_UNITS = ["empresarial-next", "empresarial-next-lab"];

/** Retorna a primeira unit ativa entre as candidatas, ou null. */
function detectActiveUnit() {
  for (const unit of CANDIDATE_UNITS) {
    const result = spawnSync("systemctl", ["is-active", "--quiet", unit], {
      stdio: "ignore",
    });
    if (result.status === 0) return unit;
  }
  return null;
}

/** Executa comando e encerra o processo com o mesmo exit code em caso de falha. */
function run(command, args, label) {
  console.log(`[deploy:next] ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) {
    console.error(`[deploy:next] Falha ao executar ${command}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** Build + restart da unit Next configurada ou detectada. */
function main() {
  const unit = process.argv[2]?.trim() || detectActiveUnit() || "empresarial-next";

  run("npm", ["run", "build"], "npm run build");
  run("sudo", ["systemctl", "restart", unit], `sudo systemctl restart ${unit}`);
  run("systemctl", ["is-active", unit], `status ${unit}`);
  console.log(`[deploy:next] OK — ${unit} ativo`);
}

main();
