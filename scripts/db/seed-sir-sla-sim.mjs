/**
 * Lab: grava RAL/REC (e DSR/TCQ) com idades controladas para simular SLA.
 * Uso: node scripts/db/seed-sir-sla-sim.mjs
 *      node scripts/db/seed-sir-sla-sim.mjs --toast   (insere um estouro novo para pop-up)
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
        cf_executante: "CF LAB /NET/FO",
        detalhes: "Simulação: deve ficar verde na tabela RAL.",
        expect: "verde (RAL SLA 6h)",
      },
      {
        num_recup: "RAL-SLA-OVER/2026",
        descricao: "[SLA sim] Estouro de SLA (7h ≥ 6h)",
        tipo_ral: "REDE",
        codigo_anormalidade: "SLA-OVER",
        abertura: formatAbertura(hoursAgo(7), true),
        duracao: "0d.07h00m",
        cf_executante: "CF LAB /NET/FO",
        detalhes: "Simulação: vermelho + entra no badge SIR.",
        expect: "vermelho + badge + pop-up SLA",
      },
    ],
    recs: [
      {
        num_recup: "REC-SLA-OK/2026",
        prioridade: "ALTA",
        pontos: "8",
        cliente: "[SLA sim] Dentro do SLA (1h < 2h)",
        designacao: "SIM-REC-OK",
        abertura: formatAbertura(hoursAgo(1), false),
        cf_executante: "CF LAB /NET/FO",
        detalhes_title: "Simulação: deve ficar verde na tabela REC.",
        expect: "verde (REC SLA 2h)",
      },
      {
        num_recup: "REC-SLA-OVER/2026",
        prioridade: "ALTA",
        pontos: "10",
        cliente: "[SLA sim] Estouro de SLA (3h ≥ 2h)",
        designacao: "SIM-REC-OVER",
        abertura: formatAbertura(hoursAgo(3), false),
        cf_executante: "CF LAB /NET/FO",
        detalhes_title: "Simulação: vermelho + badge SIR.",
        expect: "vermelho + badge + pop-up SLA",
      },
      {
        num_recup: "DSR-SLA-OVER/2026",
        prioridade: "MEDIA",
        pontos: "5",
        cliente: "[SLA sim] DSR estouro (4h ≥ 2h)",
        designacao: "SIM-DSR-OVER",
        abertura: formatAbertura(hoursAgo(4), false),
        cf_executante: "CF LAB DDD",
        detalhes_title: "Simulação DSR fora do SLA REC.",
        expect: "vermelho (grupo REC)",
      },
      {
        num_recup: "TCQ-SLA-OVER/2026",
        prioridade: "BAIXA",
        pontos: "2",
        cliente: "[SLA sim] TCQ estouro (5h ≥ 2h)",
        designacao: "SIM-TCQ-OVER",
        abertura: formatAbertura(hoursAgo(5), false),
        cf_executante: "CF LAB DDD",
        detalhes_title: "Simulação TCQ fora do SLA REC.",
        expect: "vermelho (grupo REC)",
      },
    ],
  };
}

/** Insere um estouro único para disparar pop-up no próximo poll (chave nova). */
async function insertToastTrigger(connection) {
  const stamp = Date.now().toString(36).toUpperCase();
  const ralNum = `RAL-SLA-TOAST-${stamp}/2026`;
  const recNum = `REC-SLA-TOAST-${stamp}/2026`;
  await upsertRal(connection, {
    num_recup: ralNum,
    descricao: "[SLA sim] Pop-up RAL estouro",
    tipo_ral: "REDE",
    codigo_anormalidade: "SLA-TOAST",
    abertura: formatAbertura(hoursAgo(8), true),
    duracao: "0d.08h00m",
    cf_executante: "CF LAB /NET/FO",
    detalhes: "Disparo de toast — feche e veja subir em ~10s.",
  });
  await upsertRec(connection, {
    num_recup: recNum,
    prioridade: "ALTA",
    pontos: "9",
    cliente: "[SLA sim] Pop-up REC estouro",
    designacao: `SIM-TOAST-${stamp}`,
    abertura: formatAbertura(hoursAgo(3), false),
    cf_executante: "CF LAB /NET/FO",
    detalhes_title: "Disparo de toast — feche e veja subir em ~10s.",
  });
  return { ralNum, recNum };
}

/** Popula simulação de SLA e imprime o roteiro de validação no browser. */
async function main() {
  const wantToast = process.argv.includes("--toast");
  const samples = buildFixedSamples();
  const connection = await mysql.createConnection(getConfig());

  for (const row of samples.rals) await upsertRal(connection, row);
  for (const row of samples.recs) await upsertRec(connection, row);

  let toastIds = null;
  if (wantToast) toastIds = await insertToastTrigger(connection);

  await connection.end();

  console.log("[sla-sim] Registros gravados (ATIVO):\n");
  for (const row of samples.rals) {
    console.log(`  RAL  ${row.num_recup}  abertura=${row.abertura}  → ${row.expect}`);
  }
  for (const row of samples.recs) {
    console.log(`  REC  ${row.num_recup}  abertura=${row.abertura}  → ${row.expect}`);
  }
  if (toastIds) {
    console.log(`\n[sla-sim] Toast triggers: ${toastIds.ralNum}, ${toastIds.recNum}`);
  }

  console.log(`
[sla-sim] Como validar (com npm run dev e sessão logada):

  1) Cores
     - /sir/rals → RAL-SLA-OK verde, RAL-SLA-OVER vermelho
     - /sir/recs → REC-SLA-OK verde; OVER (REC/DSR/TCQ) vermelho

  2) Badge SIR no menu
     - Deve mostrar ≥ 4 (OVER + DSR + TCQ; +2 se usou --toast)

  3) Pop-ups de SLA / novos /NET/FO
     No DevTools (Console), force o diff:
       localStorage.setItem("emp:sir-age-alert-seen", "[]");
       localStorage.setItem("emp:sir-net-fo-seen", "[]");
     Depois mude de aba e volte (ou espere ~60s).
     Toasts ficam 10s no canto inferior direito e sobem ao sair.

  4) Novo pop-up sem limpar storage
     node scripts/db/seed-sir-sla-sim.mjs --toast
`);
}

main().catch((err) => {
  console.error("[sla-sim] Failed:", err.message);
  process.exit(1);
});
