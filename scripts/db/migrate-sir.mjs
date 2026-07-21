import fs from "fs";
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
  if (value == null || value === "") {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

/** Monta configuração de conexão MySQL SIR a partir do ambiente. */
function getConfig() {
  return {
    host: env("SIR_DB_HOST", "127.0.0.1"),
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: env("SIR_DB_USER", "monitor"),
    password: env("SIR_DB_PASSWORD", "troque_me"),
    database: env("SIR_DB_NAME", "claroEmpresarial"),
  };
}

/** Cria tabela schema_migrations se não existir. */
async function ensureMigrationTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/** Retorna IDs de migrations já aplicadas. */
async function getAppliedIds(connection) {
  const [rows] = await connection.query("SELECT id FROM schema_migrations");
  return new Set(rows.map((row) => row.id));
}

/** Indica se migration 002 deve ser ignorada (schema já alinhado com prod). */
async function shouldSkipMigration(connection, migrationId) {
  if (migrationId !== "002_align_prod_schema") {
    return false;
  }

  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'rals'
       AND column_name = 'id'`,
  );

  return Number(rows[0]?.cnt ?? 0) > 0;
}

/** Registra migration como aplicada em schema_migrations. */
async function markMigrationApplied(connection, migrationId) {
  await connection.query("INSERT INTO schema_migrations (id) VALUES (?)", [
    migrationId,
  ]);
}

/** Carrega arquivos SQL de migrations/sir ordenados por nome. */
function loadMigrationFiles() {
  const dir = path.join(repoRoot, "migrations/sir");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({
      id: name.replace(/\.sql$/, ""),
      path: path.join(dir, name),
      sql: fs.readFileSync(path.join(dir, name), "utf8"),
    }));
}

/** Aplica migrations pendentes no banco claroEmpresarial. */
async function main() {
  const config = getConfig();
  const adminConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  console.log(`[db:migrate] Ensuring database ${config.database}...`);
  await adminConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await adminConnection.changeUser({ database: config.database });
  await ensureMigrationTable(adminConnection);

  const applied = await getAppliedIds(adminConnection);
  const migrations = loadMigrationFiles();
  let count = 0;

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      console.log(`[db:migrate] skip ${migration.id}`);
      continue;
    }

    if (await shouldSkipMigration(adminConnection, migration.id)) {
      console.log(`[db:migrate] skip ${migration.id} (already aligned with prod)`);
      await markMigrationApplied(adminConnection, migration.id);
      count += 1;
      continue;
    }

    console.log(`[db:migrate] apply ${migration.id}...`);
    await adminConnection.query(migration.sql);
    await markMigrationApplied(adminConnection, migration.id);
    count += 1;
  }

  await adminConnection.end();
  console.log(`[db:migrate] Done (${count} migration(s) applied).`);
}

main().catch((err) => {
  console.error("[db:migrate] Failed:", err.message);
  process.exit(1);
});
