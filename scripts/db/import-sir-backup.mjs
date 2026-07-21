import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

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

/** Resolve caminho do arquivo de backup (arg, env ou padrão na raiz). */
function resolveBackupPath(args) {
  const fromArg = args.find((arg) => !arg.startsWith("-"));
  const fromEnv = process.env.SIR_BACKUP_FILE;
  const defaultPath = path.join(repoRoot, "backup_sir_16052026.sql");

  const candidate = fromArg ?? fromEnv ?? defaultPath;
  return path.resolve(candidate);
}

/** Lista IDs de migrations disponíveis em migrations/sir. */
function loadMigrationIds() {
  const dir = path.join(repoRoot, "migrations/sir");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => name.replace(/\.sql$/, ""));
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

/** Marca todas as migrations como aplicadas após import de backup. */
async function syncMigrations(connection) {
  await ensureMigrationTable(connection);
  for (const id of loadMigrationIds()) {
    await connection.query(
      "INSERT IGNORE INTO schema_migrations (id) VALUES (?)",
      [id],
    );
  }
}

/** Restaura dump SQL de produção no banco local claroEmpresarial. */
async function main() {
  const force = process.argv.includes("--force");
  const backupPath = resolveBackupPath(process.argv.slice(2));
  const config = getConfig();

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  if (!LOCAL_HOSTS.has(config.host) && !force) {
    throw new Error(
      `Refusing to import into non-local host "${config.host}". Use --force if intentional.`,
    );
  }

  const sql = fs.readFileSync(backupPath, "utf8");
  const sizeMb = (Buffer.byteLength(sql) / (1024 * 1024)).toFixed(2);

  console.log(`[db:import] Target ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log(`[db:import] File ${backupPath} (${sizeMb} MB)`);

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  });

  console.log("[db:import] Restoring dump (DROP + CREATE + INSERT)...");
  await connection.query(sql);
  await syncMigrations(connection);

  const [[{ rals }]] = await connection.query(
    "SELECT COUNT(*) AS rals FROM rals",
  );
  const [[{ recs }]] = await connection.query(
    "SELECT COUNT(*) AS recs FROM recs",
  );

  await connection.end();
  console.log(`[db:import] Done — ${rals} RAL(s), ${recs} REC/DSR(s).`);
}

main().catch((err) => {
  console.error("[db:import] Failed:", err.message);
  process.exit(1);
});
