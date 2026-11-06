/**
 * Lab: grava RAL/REC (e DSR/TCQ) com idades controladas para simular SLA.
 * Uso: node scripts/db/seed-sir-sla-sim.mjs
 *      node scripts/db/seed-sir-sla-sim.mjs --toast          (3 disparos novos no modal)
 *      node scripts/db/seed-sir-sla-sim.mjs --toast --count=10
 */
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

/** Lê variável de ambiente ou fallback; lança se ausente. */
function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value == null || value === "") throw new Error(`Missing env ${name}`);
  return value;
}

/** Monta configuração de conexão MySQL SIR a partir do ambiente. */
function getConfig() {
  const socketPath = (process.env.SIR_DB_SOCKET || "").trim();
  return {
    host: env("SIR_DB_HOST", "127.0.0.1"),
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: env("SIR_DB_USER", "monitor"),
    password: env("SIR_DB_PASSWORD", "troque_me"),
    database: env("SIR_DB_NAME", "claroEmpresarial"),
    ...(socketPath ? { socketPath } : {}),
  };
}

/** Formata Date no padrão de abertura SIR (`dd/mm/yyyy - HH:mm` ou com espaço). */
function formatAbertura(date, withDash) {
  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const sep = withDash ? " - " : " ";
  return `${day}/${month}/${year}${sep}${hour}:${minute}`;
}

/** Retorna agora menos `hours` (fuso local do host). */
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000);
}

/** Insere ou atualiza RAL de simulação (sempre ATIVO e com abertura informada). */
async function upsertRal(connection, row) {
  await connection.execute(
    `INSERT INTO rals (
      num_recup, descricao, tipo_ral, codigo_anormalidade, abertura, duracao,
      cf_executante, status, ultima_atualizacao, detalhes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO', NOW(), ?)
    ON DUPLICATE KEY UPDATE
      descricao = VALUES(descricao),
      abertura = VALUES(abertura),
      cf_executante = VALUES(cf_executante),
      status = 'ATIVO',
      ultima_atualizacao = NOW(),
      detalhes = VALUES(detalhes)`,
    [
      row.num_recup,
      row.descricao,
      row.tipo_ral,
      row.codigo_anormalidade,
      row.abertura,
      row.duracao,
      row.cf_executante,
      row.detalhes,
    ],
  );
}

/** Insere ou atualiza REC/DSR/TCQ de simulação (sempre ATIVO e com abertura informada). */
async function upsertRec(connection, row) {
  await connection.execute(
    `INSERT INTO recs (
      num_recup, prioridade, pontos, cliente, designacao, abertura,
      cf_executante, status, ultima_atualizacao, detalhes_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO', NOW(), ?)
    ON DUPLICATE KEY UPDATE
      cliente = VALUES(cliente),
      abertura = VALUES(abertura),
      cf_executante = VALUES(cf_executante),
      status = 'ATIVO',
      ultima_atualizacao = NOW(),
      detalhes_title = VALUES(detalhes_title)`,
    [
      row.num_recup,
      row.prioridade,
      row.pontos,
      row.cliente,
      row.designacao,
      row.abertura,
      row.cf_executante,
      row.detalhes_title,
    ],
  );
}

/** CFs com código geográfico real (2º segmento) para filtro por UF. */
const CF_BY_UF = {
  MA: "CF/SLS/NET/FO",
  AM: "CF/MNS/NET/FO",
  PA: "CF/BLM/NET/FO",
  AP: "CF/MPA/NET/FO",
};

/** Monta o conjunto fixo de registros para cor, badge e (opcionalmente) pop-up. */
function buildFixedSamples() {
  return {
    rals: [
      {
        num_recup: "RAL-SLA-OK/2026",
        descricao: "[SLA sim] Dentro do SLA (2h < 6h)",
        tipo_ral: "REDE",
        codigo_anormalidade: "SLA-OK",
        abertura: formatAbertura(hoursAgo(2), true),
        duracao: "0d.02h00m",
        cf_executante: CF_BY_UF.MA,
        detalhes: "Simulação: deve ficar verde na tabela RAL.",
        expect: "verde (RAL SLA 6h · MA/SLS)",
      },
      {
        num_recup: "RAL-SLA-OVER/2026",
        descricao: "[SLA sim] Estouro de SLA (7h ≥ 6h)",
        tipo_ral: "REDE",
        codigo_anormalidade: "SLA-OVER",
        abertura: formatAbertura(hoursAgo(7), true),
        duracao: "0d.07h00m",
        cf_executante: CF_BY_UF.AM,
        detalhes: "Simulação: vermelho + entra no badge SIR.",
        expect: "vermelho + badge + pop-up SLA · AM/MNS",
      },
    ],
    recs: [
      {
        num_recup: "REC-SLA-OK/2026",
        prioridade: "ALTA",
        pontos: "8",
        cliente: "[SLA sim] Verde (1h < 2h)",
        designacao: "SIM-REC-OK",
        abertura: formatAbertura(hoursAgo(1), false),
        cf_executante: CF_BY_UF.PA,
        detalhes_title: "Simulação: deve ficar verde na tabela REC.",
        expect: "verde (REC até 01:59 · PA/BLM)",
      },
      {
        num_recup: "REC-SLA-WARN/2026",
        prioridade: "ALTA",
        pontos: "9",
        cliente: "[SLA sim] Amarelo (3h · 02–03:59)",
        designacao: "SIM-REC-WARN",
        abertura: formatAbertura(hoursAgo(3), false),
        cf_executante: CF_BY_UF.MA,
        detalhes_title: "Simulação: amarelo + modal de atenção.",
        expect: "amarelo (REC 02:00–03:59 · MA/SLS)",
      },
      {
        num_recup: "REC-SLA-OVER/2026",
        prioridade: "ALTA",
        pontos: "10",
        cliente: "[SLA sim] Vermelho (≥4h)",
        designacao: "SIM-REC-OVER",
        abertura: formatAbertura(hoursAgo(5), false),
        cf_executante: CF_BY_UF.AM,
        detalhes_title: "Simulação: vermelho + badge SIR + modal.",
        expect: "vermelho (≥04:00 · AM/MNS)",
      },
      {
        num_recup: "DSR-SLA-OVER/2026",
        prioridade: "MEDIA",
        pontos: "5",
        cliente: "[SLA sim] DSR vermelho (≥4h)",
        designacao: "SIM-DSR-OVER",
        abertura: formatAbertura(hoursAgo(4.5), false),
        cf_executante: CF_BY_UF.PA,
        detalhes_title: "Simulação DSR fora do SLA REC.",
        expect: "vermelho (DSR · PA/BLM)",
      },
      {
        num_recup: "TCQ-SLA-OVER/2026",
        prioridade: "BAIXA",
        pontos: "2",
        cliente: "[SLA sim] TCQ vermelho (≥4h)",
        designacao: "SIM-TCQ-OVER",
        abertura: formatAbertura(hoursAgo(6), false),
        cf_executante: CF_BY_UF.MA,
        detalhes_title: "Simulação TCQ fora do SLA REC.",
        expect: "vermelho (TCQ · MA/SLS)",
      },
    ],
  };
}

/** Lê `--count=N` da linha de comando (padrão 3). */
function parseToastCount() {
  const arg = process.argv.find((item) => item.startsWith("--count="));
  if (!arg) return 3;
  const value = Number(arg.slice("--count=".length));
  if (!Number.isFinite(value) || value < 1) return 3;
  return Math.min(Math.floor(value), 40);
}

/**
 * Insere N chamados únicos para disparar o modal central.
 * Alterna amarelo/vermelho e RAL/REC para exercitar as duas seções.
 */
async function insertToastTriggers(connection, count) {
  const stamp = Date.now().toString(36).toUpperCase();
  const ids = [];

  const ufCycle = /** @type {Array<keyof typeof CF_BY_UF>} */ (["MA", "AM", "PA", "AP"]);

  for (let i = 1; i <= count; i += 1) {
    const isWarn = i % 2 === 1;
    const asRal = i % 3 === 0;
    const uf = ufCycle[(i - 1) % ufCycle.length];
    const cf = CF_BY_UF[uf];
    const suffix = `${stamp}-${String(i).padStart(2, "0")}`;

    if (asRal) {
      const num = `RAL-SLA-TOAST-${suffix}/2026`;
      await upsertRal(connection, {
        num_recup: num,
        descricao: `[SLA sim] Modal RAL ${isWarn ? "amarelo" : "vermelho"} #${i} (${uf})`,
        tipo_ral: "REDE",
        codigo_anormalidade: "SLA-TOAST",
        abertura: formatAbertura(hoursAgo(isWarn ? 3.5 : 8), true),
        duracao: isWarn ? "0d.03h30m" : "0d.08h00m",
        cf_executante: cf,
        detalhes: `Disparo em lote (${i}/${count}) · ${uf}.`,
      });
      ids.push({ num, level: isWarn ? "amarelo" : "vermelho", kind: "RAL", uf });
      continue;
    }

    const num = `REC-SLA-TOAST-${suffix}/2026`;
    await upsertRec(connection, {
      num_recup: num,
      prioridade: isWarn ? "MEDIA" : "ALTA",
      pontos: String(5 + (i % 5)),
      cliente: `[SLA sim] Modal REC ${isWarn ? "amarelo" : "vermelho"} #${i} (${uf})`,
      designacao: `SIM-TOAST-${suffix}`,
      abertura: formatAbertura(hoursAgo(isWarn ? 3 : 5.5), false),
      cf_executante: cf,
      detalhes_title: `Disparo em lote (${i}/${count}) · ${uf}.`,
    });
    ids.push({ num, level: isWarn ? "amarelo" : "vermelho", kind: "REC", uf });
  }

  return ids;
}

/** Popula simulação de SLA e imprime o roteiro de validação no browser. */
async function main() {
  const wantToast = process.argv.includes("--toast");
  const samples = buildFixedSamples();
  const connection = await mysql.createConnection(getConfig());

  for (const row of samples.rals) await upsertRal(connection, row);
  for (const row of samples.recs) await upsertRec(connection, row);

  const toastCount = wantToast ? parseToastCount() : 0;
  let toastIds = null;
  if (wantToast) toastIds = await insertToastTriggers(connection, toastCount);

  await connection.end();

  console.log("[sla-sim] Registros gravados (ATIVO):\n");
  for (const row of samples.rals) {
    console.log(`  RAL  ${row.num_recup}  abertura=${row.abertura}  → ${row.expect}`);
  }
  for (const row of samples.recs) {
    console.log(`  REC  ${row.num_recup}  abertura=${row.abertura}  → ${row.expect}`);
  }
  if (toastIds) {
    console.log(`\n[sla-sim] Modal triggers (${toastIds.length}):`);
    for (const item of toastIds) {
      console.log(`  ${item.kind}  ${item.num}  → ${item.level} · ${item.uf}`);
    }
  }

  console.log(`
[sla-sim] Como validar (com npm run dev e sessão logada):

  1) Cores + legenda
     - /sir → legenda RAL e REC/DSR/TCQ
     - /sir/rals → RAL-SLA-OK verde, RAL-SLA-OVER vermelho
     - /sir/recs → OK verde, WARN amarelo, OVER (REC/DSR/TCQ) vermelho

  2) Badge SIR no menu
     - Conta estouros (≥SLA); sobe com --toast

  3) Modal central (idade/SLA) + lateral (só /NET/FO)
     Com --toast já entram chaves novas (não precisa limpar storage).
     Mude de aba e volte (ou espere ~60s).
     - Centro: modal de idade/SLA (rolagem se muitos)
     - Lateral: só novos /NET/FO

  4) Novo modal sem limpar storage
     npm run db:seed-sla-sim -- --toast
     npm run db:seed-sla-sim -- --toast --count=10
`);
}

main().catch((err) => {
  console.error("[sla-sim] Failed:", err.message);
  process.exit(1);
});
