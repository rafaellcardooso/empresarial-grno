/**
 * Integração: seed multi-UF + filtro SQL espelhando getShellAlerts.
 * Uso: npm run db:test-region-alerts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const CODES_BY_UF = {
  MA: ["SLS", "BLA", "CXUA", "ITZ"],
  AM: ["MNS", "BVA"],
  PA: ["ATM", "BLM", "MBA", "MOSQ", "SRM"],
  AP: ["MPA"],
};

/** Lê variável de ambiente ou fallback. */
function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value == null || value === "") throw new Error(`Missing env ${name}`);
  return value;
}

/** Conecta no MySQL SIR. */
async function connect() {
  const socketPath = (process.env.SIR_DB_SOCKET || "").trim();
  return mysql.createConnection({
    host: env("SIR_DB_HOST", "127.0.0.1"),
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: env("SIR_DB_USER", "monitor"),
    password: env("SIR_DB_PASSWORD", "troque_me"),
    database: env("SIR_DB_NAME", "claroEmpresarial"),
    ...(socketPath ? { socketPath } : {}),
  });
}

/** Códigos CF para o conjunto de UFs. */
function codesForUfs(ufs) {
  return ufs.flatMap((uf) => CODES_BY_UF[uf] ?? []);
}

/** Lista ativos /NET/FO filtrados por códigos de CF (espelha listActiveSirNetFo). */
async function listNetFo(connection, ufs) {
  const codes = codesForUfs(ufs);
  if (codes.length === 0) return [];
  const placeholders = codes.map(() => "?").join(", ");
  const ufSql = `AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(cf_executante, '/', 2), '/', -1))
    IN (${placeholders})`;
  const pattern = "%/NET/FO";
  const [rals] = await connection.query(
    `SELECT num_recup, cf_executante AS cf FROM rals
     WHERE status = 'ATIVO'
       AND REPLACE(UPPER(cf_executante), ' ', '') LIKE ?
       ${ufSql}`,
    [pattern, ...codes],
  );
  const [recs] = await connection.query(
    `SELECT num_recup, cf_executante AS cf FROM recs
     WHERE status = 'ATIVO'
       AND REPLACE(UPPER(cf_executante), ' ', '') LIKE ?
       ${ufSql}`,
    [pattern, ...codes],
  );
  return [...rals, ...recs].map((row) => ({
    num: String(row.num_recup),
    cf: String(row.cf),
    code: String(row.cf).split("/")[1]?.trim().toUpperCase() ?? "",
  }));
}

/** Lista ativos no limiar de idade filtrados por UF (espelha listActiveSirAgeAlerts). */
async function listAge(connection, ufs) {
  const codes = codesForUfs(ufs);
  if (codes.length === 0) return [];
  const placeholders = codes.map(() => "?").join(", ");
  const ufSql = `AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(cf_executante, '/', 2), '/', -1))
    IN (${placeholders})`;
  const abertura = `COALESCE(
    STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
    STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
  )`;
  const [rals] = await connection.query(
    `SELECT num_recup, cf_executante AS cf FROM rals
     WHERE status = 'ATIVO'
       AND ${abertura} IS NOT NULL
       AND TIMESTAMPDIFF(HOUR, ${abertura}, NOW()) >= 2
       ${ufSql}`,
    codes,
  );
  const [recs] = await connection.query(
    `SELECT num_recup, cf_executante AS cf FROM recs
     WHERE status = 'ATIVO'
       AND ${abertura} IS NOT NULL
       AND TIMESTAMPDIFF(HOUR, ${abertura}, NOW()) >= 2
       ${ufSql}`,
    codes,
  );
  return [...rals, ...recs].map((row) => ({
    num: String(row.num_recup),
    cf: String(row.cf),
    code: String(row.cf).split("/")[1]?.trim().toUpperCase() ?? "",
  }));
}

/** Roda seed + asserts de filtro por UF. */
async function main() {
  console.log("[test-region] seeding toast count=8…");
  const seed = spawnSync("npm", ["run", "db:seed-sla-sim", "--", "--toast", "--count=8"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
  if (seed.status !== 0) {
    throw new Error(seed.stderr || seed.stdout || "seed failed");
  }

  const connection = await connect();

  const [schemaHome] = await connection.query("SHOW COLUMNS FROM app_users LIKE 'home_uf'");
  const [schemaAlert] = await connection.query(
    "SHOW COLUMNS FROM app_user_settings LIKE 'alert_ufs'",
  );
  assert.equal(schemaHome.length, 1, "coluna home_uf deve existir");
  assert.equal(schemaAlert.length, 1, "coluna alert_ufs deve existir");

  const [usersIncomplete] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM app_users u
     LEFT JOIN app_user_settings s ON s.user_id = u.id
     WHERE u.status = 'ACTIVE'
       AND (u.home_uf IS NULL OR COALESCE(s.alert_ufs, '') = '')`,
  );
  console.log(
    `[test-region] usuários ACTIVE sem região completa: ${Number(usersIncomplete[0].cnt)}`,
  );

  const cases = [
    { ufs: ["MA"], allowed: new Set(CODES_BY_UF.MA) },
    { ufs: ["AM"], allowed: new Set(CODES_BY_UF.AM) },
    { ufs: ["PA"], allowed: new Set(CODES_BY_UF.PA) },
    { ufs: ["AP"], allowed: new Set(CODES_BY_UF.AP) },
  ];

  const summary = {};
  for (const item of cases) {
    const netFo = await listNetFo(connection, item.ufs);
    const age = await listAge(connection, item.ufs);
    for (const row of [...netFo, ...age]) {
      assert.ok(
        item.allowed.has(row.code),
        `${item.ufs.join(",")} recebeu CF ${row.cf} (code=${row.code})`,
      );
    }
    summary[item.ufs.join("+")] = { netFo: netFo.length, age: age.length };
    console.log(`[test-region] ${item.ufs.join("+")}: netFo=${netFo.length} age=${age.length}`);
  }

  const emptyNet = await listNetFo(connection, []);
  const emptyAge = await listAge(connection, []);
  assert.equal(emptyNet.length, 0);
  assert.equal(emptyAge.length, 0);

  const allNet = await listNetFo(connection, ["MA", "AM", "PA", "AP"]);
  const allAge = await listAge(connection, ["MA", "AM", "PA", "AP"]);
  assert.ok(allAge.length >= summary.MA.age, "ALL age >= MA age");
  assert.ok(allNet.length >= summary.MA.netFo, "ALL netFo >= MA netFo");

  assert.ok(summary.MA.age >= 1, "MA deve ter ao menos 1 age alert");
  assert.ok(summary.AM.age >= 1, "AM deve ter ao menos 1 age alert");
  assert.ok(summary.PA.age >= 1, "PA deve ter ao menos 1 age alert");
  assert.ok(summary.AP.age >= 1, "AP deve ter ao menos 1 age alert (MPA)");

  await connection.end();
  console.log("[test-region] OK");
  console.log(
    JSON.stringify({ ...summary, all: { netFo: allNet.length, age: allAge.length } }, null, 2),
  );
}

main().catch((err) => {
  console.error("[test-region] FAILED:", err.message);
  process.exit(1);
});
