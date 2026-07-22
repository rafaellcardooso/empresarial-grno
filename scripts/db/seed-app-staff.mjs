import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const CORPORATE_ID_RE = /^[A-Z][A-Z0-9]{3,11}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

/** Lê variável obrigatória do ambiente. */
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

/** Normaliza matrícula corporativa. */
function normalizeCorporateId(value) {
  return value.trim().toUpperCase();
}

/** Monta config MySQL SIR. */
function getConfig() {
  return {
    host: process.env.SIR_DB_HOST || "127.0.0.1",
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: required("SIR_DB_USER"),
    password: required("SIR_DB_PASSWORD"),
    database: process.env.SIR_DB_NAME || "claroEmpresarial",
  };
}

/** Restaura stdin após leitura em raw mode (readline volta a funcionar). */
function releaseStdinAfterSecret() {
  input.setRawMode(false);
  input.resume();
}

/** Lê senha sem eco no terminal. */
async function promptSecret(label) {
  process.stdout.write(label);
  const chars = [];

  return new Promise((resolve) => {
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    /** Lê tecla a tecla até Enter. */
    function onData(char) {
      if (char === "\u0003") {
        process.stdout.write("\n");
        releaseStdinAfterSecret();
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        input.removeListener("data", onData);
        releaseStdinAfterSecret();
        process.stdout.write("\n");
        resolve(chars.join("").trim());
        return;
      }

      if (char === "\u007f" || char === "\b") {
        if (chars.length > 0) chars.pop();
        return;
      }

      chars.push(char);
    }

    input.on("data", onData);
  });
}

/** Pergunta no terminal (sem eco para senha). */
async function prompt(rl, label, { secret = false } = {}) {
  if (!secret) {
    return (await rl.question(label)).trim();
  }

  rl.pause();
  try {
    return await promptSecret(label);
  } finally {
    rl.resume();
  }
}

/** Valida matrícula, senha e confirmação. */
function validateStaffInput(corporateId, name, password, confirmPassword) {
  const normalizedId = normalizeCorporateId(corporateId);
  if (!CORPORATE_ID_RE.test(normalizedId)) {
    throw new Error("Matrícula inválida (ex.: F104262).");
  }
  if (!name || name.trim().length < 2) {
    throw new Error("Informe o nome completo.");
  }
  if (!PASSWORD_RE.test(password)) {
    throw new Error("Senha: mínimo 8 caracteres, com letras e números.");
  }
  if (password !== confirmPassword) {
    throw new Error("As senhas não coincidem.");
  }
  return { corporateId: normalizedId, name: name.trim() };
}

/** Lê argumento CLI --chave valor ou --chave=valor. */
function readCliArg(name) {
  const eqPrefix = `--${name}=`;
  const flagIndex = process.argv.indexOf(`--${name}`);
  if (flagIndex >= 0) {
    return process.argv[flagIndex + 1]?.trim() || null;
  }
  const withEquals = process.argv.find((arg) => arg.startsWith(eqPrefix));
  if (withEquals) {
    return withEquals.slice(eqPrefix.length).trim() || null;
  }
  return null;
}

/** Monta payload de staff a partir de flags CLI (modo não interativo). */
function readStaffFromCli() {
  const corporateId = readCliArg("corporate-id");
  const name = readCliArg("name");
  const password = readCliArg("password");
  const emailRaw = readCliArg("email");

  if (!corporateId && !name && !password && !emailRaw) {
    return null;
  }

  if (!corporateId || !name || !password) {
    throw new Error("Modo CLI exige --corporate-id, --name e --password ( --email opcional ).");
  }

  const inputData = validateStaffInput(corporateId, name, password, password);
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  return { ...inputData, email };
}

/** Persiste staff no MySQL após validação. */
async function insertStaff(connection, inputData, password, email) {
  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await connection.query(
    `SELECT id FROM app_users WHERE corporate_id = ? LIMIT 1`,
    [inputData.corporateId],
  );
  if (existing.length > 0) {
    throw new Error(`Matrícula ${inputData.corporateId} já cadastrada.`);
  }

  const [result] = await connection.execute(
    `INSERT INTO app_users (corporate_id, email, name, password_hash, role, status, approved_at)
       VALUES (?, ?, ?, ?, 'STAFF', 'ACTIVE', NOW())`,
    [inputData.corporateId, email, inputData.name, passwordHash],
  );

  await connection.execute(
    `INSERT IGNORE INTO app_user_settings (user_id, tour_completed_version) VALUES (?, 0)`,
    [result.insertId],
  );

  console.log(`[db:seed-staff] Staff criado: ${inputData.corporateId}`);
  console.log("[db:seed-staff] Faça login em /login com essa matrícula.");
}

/** Conta staff ativos no banco. */
async function countActiveStaff(connection) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM app_users WHERE role = 'STAFF' AND status = 'ACTIVE'`,
  );
  return Number(rows[0]?.cnt ?? 0);
}

/** Cria o único usuário staff (interativo). */
async function createStaffInteractive(connection) {
  const cliStaff = readStaffFromCli();
  if (cliStaff) {
    await insertStaff(connection, cliStaff, readCliArg("password"), cliStaff.email);
    return;
  }

  const rl = createInterface({ input, output });

  try {
    console.log("[db:seed-staff] Primeiro acesso — crie o administrador (staff único).");
    console.log("[db:seed-staff] Nada é gravado no .env; a senha fica só no banco.\n");

    const corporateId = await prompt(rl, "Matrícula corporativa: ");
    const name = await prompt(rl, "Nome: ");
    const password = await prompt(rl, "Senha: ", { secret: true });
    const confirmPassword = await prompt(rl, "Confirmar senha: ", { secret: true });
    const emailRaw = await prompt(rl, "E-mail corporativo (opcional, Enter pula): ");
    const email = emailRaw ? emailRaw.toLowerCase() : null;

    const inputData = validateStaffInput(corporateId, name, password, confirmPassword);
    await insertStaff(connection, inputData, password, email);
  } finally {
    rl.close();
  }
}

/** Redefine senha do staff existente (interativo). */
async function resetStaffPasswordInteractive(connection) {
  const rl = createInterface({ input, output });

  try {
    const corporateId = normalizeCorporateId(await prompt(rl, "Matrícula do staff: "));
    const password = await prompt(rl, "Nova senha: ", { secret: true });
    const confirmPassword = await prompt(rl, "Confirmar nova senha: ", { secret: true });

    if (!CORPORATE_ID_RE.test(corporateId)) {
      throw new Error("Matrícula inválida.");
    }
    if (!PASSWORD_RE.test(password) || password !== confirmPassword) {
      throw new Error("Senha inválida ou não confere.");
    }

    const [rows] = await connection.query(
      `SELECT id FROM app_users WHERE corporate_id = ? AND role = 'STAFF' LIMIT 1`,
      [corporateId],
    );
    if (rows.length === 0) {
      throw new Error("Staff não encontrado para esta matrícula.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(`UPDATE app_users SET password_hash = ? WHERE id = ?`, [
      passwordHash,
      rows[0].id,
    ]);

    console.log(`\n[db:seed-staff] Senha atualizada para ${corporateId}.`);
  } finally {
    rl.close();
  }
}

/** Entry point: cria staff uma vez ou redefine senha com --reset-password. */
async function main() {
  const resetPassword = process.argv.includes("--reset-password");
  const connection = await mysql.createConnection(getConfig());

  try {
    if (resetPassword) {
      await resetStaffPasswordInteractive(connection);
      return;
    }

    const staffCount = await countActiveStaff(connection);
    if (staffCount > 0) {
      console.log("[db:seed-staff] Staff já existe — nada a fazer.");
      console.log("[db:seed-staff] Para trocar senha: npm run db:seed-staff -- --reset-password");
      return;
    }

    await createStaffInteractive(connection);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("[db:seed-staff] Failed:", err.message);
  process.exit(1);
});
