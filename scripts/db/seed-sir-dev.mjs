import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const SIR_RECORD_STATUS_ACTIVE = "ATIVO";

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

const SAMPLE_RALS = [
  {
    num_recup: "RAL-DEV-001/2026",
    descricao: "RUP CABO OPTICO — amostra dev",
    tipo_ral: "REDE",
    codigo_anormalidade: "A001",
    abertura: "21/07/2026 10:00",
    duracao: "02:30",
    cf_executante: "CF-DEV-01",
    detalhes: "Registro de exemplo para desenvolvimento local.",
  },
  {
    num_recup: "RAL-DEV-002/2026",
    descricao: "NODE ISO — amostra dev",
    tipo_ral: "REDE",
    codigo_anormalidade: "A002",
    abertura: "21/07/2026 11:15",
    duracao: "01:10",
    cf_executante: "CF-DEV-02",
    detalhes: null,
  },
];

const SAMPLE_RECS = [
  {
    num_recup: "REC-DEV-101/2026",
    prioridade: "ALTA",
    pontos: "12",
    cliente: "CLARO S.A.",
    designacao: "Circuito empresarial — dev",
    abertura: "21/07/2026 09:00",
    cf_executante: "CF-DEV-01",
    detalhes_title: "REC de exemplo para painel local.",
  },
  {
    num_recup: "REC-DEV-102/2026",
    prioridade: "MEDIA",
    pontos: "4",
    cliente: "CLIENTE DEV LTDA",
    designacao: "Link dedicado — dev",
    abertura: "21/07/2026 08:30",
    cf_executante: "CF-DEV-03",
    detalhes_title: null,
  },
];

/** Insere ou atualiza RAL de exemplo no banco de desenvolvimento. */
async function upsertRal(connection, row) {
  await connection.execute(
    `INSERT INTO rals (
      num_recup, descricao, tipo_ral, codigo_anormalidade, abertura, duracao,
      cf_executante, status, ultima_atualizacao, detalhes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE
      descricao = VALUES(descricao),
      ultima_atualizacao = NOW(),
      status = VALUES(status)`,
    [
      row.num_recup,
      row.descricao,
      row.tipo_ral,
      row.codigo_anormalidade,
      row.abertura,
      row.duracao,
      row.cf_executante,
      SIR_RECORD_STATUS_ACTIVE,
      row.detalhes,
    ],
  );
}

/** Insere ou atualiza REC de exemplo no banco de desenvolvimento. */
async function upsertRec(connection, row) {
  await connection.execute(
    `INSERT INTO recs (
      num_recup, prioridade, pontos, cliente, designacao, abertura,
      cf_executante, status, ultima_atualizacao, detalhes_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE
      cliente = VALUES(cliente),
      ultima_atualizacao = NOW(),
      status = VALUES(status)`,
    [
      row.num_recup,
      row.prioridade,
      row.pontos,
      row.cliente,
      row.designacao,
      row.abertura,
      row.cf_executante,
      SIR_RECORD_STATUS_ACTIVE,
      row.detalhes_title,
    ],
  );
}

/** Popula banco claroEmpresarial com RALs e RECs fake para dev. */
async function main() {
  const connection = await mysql.createConnection({
    host: env("SIR_DB_HOST", "127.0.0.1"),
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: env("SIR_DB_USER", "monitor"),
    password: env("SIR_DB_PASSWORD", "troque_me"),
    database: env("SIR_DB_NAME", "claroEmpresarial"),
  });

  for (const row of SAMPLE_RALS) await upsertRal(connection, row);
  for (const row of SAMPLE_RECS) await upsertRec(connection, row);

  await connection.end();
  console.log(
    `[db:seed] Inserted ${SAMPLE_RALS.length} RAL(s) and ${SAMPLE_RECS.length} REC(s) (dev sample).`,
  );
}

main().catch((err) => {
  console.error("[db:seed] Failed:", err.message);
  process.exit(1);
});
