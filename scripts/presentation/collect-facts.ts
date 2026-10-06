/**
 * Coleta os números do deck gerencial com as mesmas queries dos relatórios do portal
 * e grava `decks/grno_empresarial/snapshot.json` (somente leitura no MySQL SIR).
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { parseSirReportParams } from "@/lib/config/sir-report-filters";
import type { SirReportData } from "@/lib/models/sir-report";
import { countSdhByVendor } from "@/lib/queries/sdh";
import { getSirReport } from "@/lib/queries/sir-reports";

const LOG_PREFIX = "[DECK]";
const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_OUT = path.join(__dirname, "decks/grno_empresarial/snapshot.json");

type CliOptions = { envFile: string; outFile: string; toStdout: boolean };

/** Lê `--env`, `--out` e `--stdout` da linha de comando. */
function parseCli(argv: string[]): CliOptions {
  const options: CliOptions = {
    envFile: path.join(REPO_ROOT, ".env.local"),
    outFile: DEFAULT_OUT,
    toStdout: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--env") options.envFile = path.resolve(argv[++i]);
    else if (argv[i] === "--out") options.outFile = path.resolve(argv[++i]);
    else if (argv[i] === "--stdout") options.toStdout = true;
  }
  return options;
}

/** Formata data local como YYYY-MM-DD (mesmo fuso do processo Node). */
function formatLocalDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Extrai do relatório SIR padrão (30 dias) aberturas, backlog, idade e DDD líder em RAL. */
function summarizeSir(report: SirReportData, from: Date, to: Date) {
  const { ral, rec } = report.summary;
  const backlogOver3Days = report.ageBuckets
    .filter((bucket) => bucket.key === "over-3d")
    .reduce((sum, bucket) => sum + bucket.total, 0);
  const topRal = report.byDdd.find((row) => row.domain === "RAL");
  return {
    periodFrom: formatLocalDate(from),
    periodTo: formatLocalDate(to),
    openedRal: ral.openingsInPeriod,
    openedRec: rec.openingsInPeriod,
    backlogRal: ral.totalActive,
    backlogRec: rec.totalActive,
    backlogOver3Days,
    topRalDdd: topRal ? { label: topRal.label, total: topRal.total } : null,
  };
}

/** Conta entregas versionadas no git: total de commits, `feat` e `fix`. */
function countDeliveries() {
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  const subjects = git("log", "--pretty=%s").split("\n").filter(Boolean);
  return {
    total: Number(git("rev-list", "--count", "HEAD").trim()),
    features: subjects.filter((subject) => /^feat(\(.+\))?!?:/.test(subject)).length,
    fixes: subjects.filter((subject) => /^fix(\(.+\))?!?:/.test(subject)).length,
  };
}

/** Descreve a origem dos dados (host/socket e banco) sem expor credenciais. */
function describeSource(): string {
  const target = process.env.SIR_DB_SOCKET?.trim() || process.env.SIR_DB_HOST || "?";
  return `${target}/${process.env.SIR_DB_NAME || "claroEmpresarial"}`;
}

/** Executa a coleta e grava o snapshot em arquivo ou na saída padrão. */
async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  loadEnv({ path: options.envFile, quiet: true });
  const log = (message: string) => console.error(`${LOG_PREFIX} ${message}`);
  log(`Lendo SIR em ${describeSource()}`);

  const filters = parseSirReportParams({});
  const [report, sdh] = await Promise.all([getSirReport(filters), countSdhByVendor()]);
  const snapshot = {
    capturedAt: new Date().toISOString(),
    source: describeSource(),
    sir: summarizeSir(report, filters.from, filters.to),
    sdh,
    deliveries: countDeliveries(),
  };

  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (options.toStdout) {
    process.stdout.write(json);
  } else {
    writeFileSync(options.outFile, json);
    log(`Snapshot gravado em ${options.outFile}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(`${LOG_PREFIX} Erro: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => global.__sirPool?.end());
