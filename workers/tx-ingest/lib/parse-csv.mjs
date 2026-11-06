import { extractUfsFromDesignacao, matchesRegion, serializeTxUfs } from "./uf.mjs";

const NUMERIC_FIELDS = [
  "TXPOWER_A",
  "RXPOWER_B",
  "SPAN_LOSS_A_TO_B",
  "REF_SPAN_LOSS_A_TO_B",
  "DIF_REF_SPAN_LOSS_A_TO_B",
  "TXPOWER_B",
  "RXPOWER_A",
  "SPAN_LOSS_B_TO_A",
  "REF_SPAN_LOSS_B_TO_A",
  "DIF_REF_SPAN_LOSS_B_TO_A",
];

/** Converte decimal BR (`15,01`) ou ponto para número; vazio → null. */
export function parseBrDecimal(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Divide uma linha CSV respeitando aspas simples (delimiter `;`). */
function splitCsvLine(line, delimiter = ";") {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

/**
 * Faz parse do CSV de potência óptica TX e filtra pelas UFs da região.
 * @returns {{ rows: object[], skipped: number }}
 */
export function parseTxOpticalCsv(text, regionUfs) {
  const cleaned = String(text ?? "").replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV TX vazio ou sem dados.");
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const required = ["DESIGNACAO", "NODE_A", "PORT_A", "NODE_B", "PORT_B"];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`CSV TX sem coluna obrigatória: ${key}`);
    }
  }

  const rows = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (cells[idx] ?? "").trim();
    });

    const designacao = record.DESIGNACAO;
    if (!designacao) {
      skipped += 1;
      continue;
    }
    if (!matchesRegion(designacao, regionUfs)) {
      skipped += 1;
      continue;
    }

    const ufs = extractUfsFromDesignacao(designacao);
    const numeric = {};
    for (const field of NUMERIC_FIELDS) {
      numeric[field] = parseBrDecimal(record[field]);
    }

    rows.push({
      designacao,
      ufs: serializeTxUfs(ufs),
      node_a: record.NODE_A || "",
      port_a: record.PORT_A || "",
      node_b: record.NODE_B || "",
      port_b: record.PORT_B || "",
      txpower_a: numeric.TXPOWER_A,
      rxpower_b: numeric.RXPOWER_B,
      span_loss_a_to_b: numeric.SPAN_LOSS_A_TO_B,
      ref_span_loss_a_to_b: numeric.REF_SPAN_LOSS_A_TO_B,
      dif_ref_span_loss_a_to_b: numeric.DIF_REF_SPAN_LOSS_A_TO_B,
      txpower_b: numeric.TXPOWER_B,
      rxpower_a: numeric.RXPOWER_A,
      span_loss_b_to_a: numeric.SPAN_LOSS_B_TO_A,
      ref_span_loss_b_to_a: numeric.REF_SPAN_LOSS_B_TO_A,
      dif_ref_span_loss_b_to_a: numeric.DIF_REF_SPAN_LOSS_B_TO_A,
    });
  }

  if (rows.length === 0) {
    throw new Error("CSV TX sem linhas na região configurada (TX_REGION_UFS).");
  }

  return { rows, skipped };
}
