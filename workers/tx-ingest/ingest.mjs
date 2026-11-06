#!/usr/bin/env node
/**
 * Ingest TX — CSV GRB de potência óptica → MySQL SIR (tx_optical_spans).
 * Uso: node ingest.mjs
 * Fixture offline: TX_CSV_FILE=fixtures/potencia_optica_de_transmissao.csv node ingest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { downloadTxCsv } from "./lib/fetch-csv.mjs";
import { openSirConnection, upsertTxSpans } from "./lib/db.mjs";
import { parseTxOpticalCsv } from "./lib/parse-csv.mjs";
import { parseRegionUfsFromEnv } from "./lib/uf.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

/** Executa um ciclo de ingest. */
async function main() {
  const regionUfs = parseRegionUfsFromEnv(process.env.TX_REGION_UFS);
  console.log(`[TX] região=${regionUfs.join(",")}`);

  let csvText;
  const localFile = process.env.TX_CSV_FILE?.trim();
  if (localFile) {
    const filePath = path.isAbsolute(localFile) ? localFile : path.join(__dirname, localFile);
    csvText = fs.readFileSync(filePath, "utf8");
    console.log(`[TX] CSV local ${filePath}`);
  } else {
    const baseUrl = process.env.GRB_BASE_URL?.trim();
    const username = process.env.GRB_TELNET_USERNAME?.trim();
    if (!baseUrl) throw new Error("Defina GRB_BASE_URL");
    if (!username) throw new Error("Defina GRB_TELNET_USERNAME / GRB_TELNET_PASSWORD");

    csvText = await downloadTxCsv({
      baseUrl,
      reportPath: process.env.TX_REPORT_PATH?.trim() || "relatorio_potencia_optica_tx.php",
      idRede: Number(process.env.TX_ID_REDE || 18),
      username,
      password: process.env.GRB_TELNET_PASSWORD ?? "",
      potOptTxV: process.env.TX_POTOPT_TX_V?.trim() || "-4;-2;0",
    });
  }

  const { rows, skipped } = parseTxOpticalCsv(csvText, regionUfs);
  console.log(`[TX] parse ok rows=${rows.length} skipped=${skipped}`);

  const connection = await openSirConnection();
  try {
    await connection.beginTransaction();
    const result = await upsertTxSpans(connection, rows, regionUfs);
    await connection.commit();
    console.log(`[TX] upserted=${result.upserted} deactivated=${result.deactivated}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[TX] FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
