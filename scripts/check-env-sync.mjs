import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SIR_DB_KEYS = ["SIR_DB_HOST", "SIR_DB_PORT", "SIR_DB_USER", "SIR_DB_PASSWORD", "SIR_DB_NAME"];

const PAIRS = [
  {
    name: "Next.js",
    example: path.join(repoRoot, ".env.example"),
    local: path.join(repoRoot, ".env.local"),
  },
  {
    name: "SIR ingest worker",
    example: path.join(repoRoot, "workers/sir-ingest/.env.example"),
    local: path.join(repoRoot, "workers/sir-ingest/.env"),
  },
];

/** Extrai estrutura de linhas (comentários, chaves, blank) de um arquivo .env. */
function parseEnvStructure(filePath) {
  if (!fs.existsSync(filePath)) {
    return { lines: [], missing: true };
  }

  const lines = [];
  for (const rawLine of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = rawLine.trimEnd();
    const content = trimmed.trim();

    if (!content) {
      lines.push({ kind: "blank" });
      continue;
    }

    if (content.startsWith("#")) {
      lines.push({ kind: "comment", text: content });
      continue;
    }

    const eq = content.indexOf("=");
    if (eq === -1) continue;
    lines.push({ kind: "key", key: content.slice(0, eq).trim() });
  }

  return { lines, missing: false };
}

/** Extrai lista ordenada de chaves de um arquivo .env. */
function parseEnvKeys(filePath) {
  const { lines, missing } = parseEnvStructure(filePath);
  if (missing) return { keys: [], missing: true };
  return { keys: lines.filter((line) => line.kind === "key").map((line) => line.key), missing: false };
}

/** Mapeia chave → valor de um arquivo .env. */
function parseEnvMap(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

/** Compara conjuntos de chaves entre example e local. */
function diffKeys(exampleKeys, localKeys) {
  const exampleSet = new Set(exampleKeys);
  const localSet = new Set(localKeys);
  return {
    onlyExample: exampleKeys.filter((key) => !localSet.has(key)),
    onlyLocal: localKeys.filter((key) => !exampleSet.has(key)),
    orderMismatch:
      exampleKeys.length === localKeys.length &&
      exampleKeys.some((key, index) => key !== localKeys[index]),
  };
}

/** Compara comentários e ordem estrutural entre example e local. */
function diffStructure(examplePath, localPath) {
  const example = parseEnvStructure(examplePath);
  const local = parseEnvStructure(localPath);
  const issues = [];

  if (example.missing || local.missing) {
    return issues;
  }

  if (example.lines.length !== local.lines.length) {
    issues.push(
      `line count differs (example ${example.lines.length}, local ${local.lines.length})`,
    );
  }

  const max = Math.max(example.lines.length, local.lines.length);
  for (let index = 0; index < max; index += 1) {
    const exampleLine = example.lines[index];
    const localLine = local.lines[index];
    const lineNo = index + 1;

    if (!exampleLine) {
      issues.push(`line ${lineNo}: extra line in local`);
      continue;
    }
    if (!localLine) {
      issues.push(`line ${lineNo}: missing line in local`);
      continue;
    }

    if (exampleLine.kind !== localLine.kind) {
      issues.push(
        `line ${lineNo}: structure mismatch (example ${exampleLine.kind}, local ${localLine.kind})`,
      );
      continue;
    }

    if (exampleLine.kind === "comment" && exampleLine.text !== localLine.text) {
      issues.push(`line ${lineNo}: comment differs`);
    }

    if (exampleLine.kind === "key" && exampleLine.key !== localLine.key) {
      issues.push(
        `line ${lineNo}: key order differs (${exampleLine.key} vs ${localLine.key})`,
      );
    }
  }

  return issues;
}

/** Verifica paridade de SIR_DB_* entre .env.local e worker .env. */
function checkSirDbAlignment() {
  const nextEnv = parseEnvMap(path.join(repoRoot, ".env.local"));
  const workerEnv = parseEnvMap(path.join(repoRoot, "workers/sir-ingest/.env"));

  if (!nextEnv.size || !workerEnv.size) {
    console.warn("[env:check] SIR_DB cross-check skipped — missing .env.local or worker .env");
    return false;
  }

  console.log("[env:check] SIR_DB (Next ↔ worker)");
  let failed = false;

  for (const key of SIR_DB_KEYS) {
    const nextVal = nextEnv.get(key);
    const workerVal = workerEnv.get(key);
    if (nextVal === undefined || workerVal === undefined) {
      failed = true;
      console.error(`  missing ${key} in Next and/or worker env`);
      continue;
    }
    if (nextVal !== workerVal) {
      failed = true;
      console.error(`  mismatch ${key}: Next="${nextVal}" worker="${workerVal}"`);
    }
  }

  if (!failed) {
    console.log("  ok (SIR_DB_* identical)");
  }
  return failed;
}

/** Executa validação de alinhamento env example ↔ local. */
function main() {
  let failed = false;

  for (const pair of PAIRS) {
    const example = parseEnvKeys(pair.example);
    const local = parseEnvKeys(pair.local);

    console.log(`[env:check] ${pair.name}`);

    if (example.missing) {
      console.error(`  missing example: ${pair.example}`);
      failed = true;
      continue;
    }

    if (local.missing) {
      console.warn(`  skip — local not found: ${pair.local}`);
      continue;
    }

    const { onlyExample, onlyLocal, orderMismatch } = diffKeys(example.keys, local.keys);

    if (onlyExample.length) {
      failed = true;
      console.error(`  keys only in .env.example: ${onlyExample.join(", ")}`);
    }
    if (onlyLocal.length) {
      failed = true;
      console.error(`  keys only in local .env: ${onlyLocal.join(", ")}`);
    }
    if (orderMismatch) {
      failed = true;
      console.error("  key order differs between .env.example and local file");
    }

    const structureIssues = diffStructure(pair.example, pair.local);
    if (structureIssues.length) {
      failed = true;
      console.error("  comments/structure differ from .env.example:");
      for (const issue of structureIssues.slice(0, 8)) {
        console.error(`    - ${issue}`);
      }
      if (structureIssues.length > 8) {
        console.error(`    - ... and ${structureIssues.length - 8} more`);
      }
    }

    if (
      !onlyExample.length &&
      !onlyLocal.length &&
      !orderMismatch &&
      !structureIssues.length
    ) {
      console.log(`  ok (${example.keys.length} keys, same order and comments)`);
    }
  }

  if (checkSirDbAlignment()) {
    failed = true;
  }

  if (failed) {
    console.error(
      "[env:check] Failed — align local .env with .env.example (same keys, order and comments).",
    );
    process.exit(1);
  }

  console.log("[env:check] All env pairs aligned.");
}

main();
