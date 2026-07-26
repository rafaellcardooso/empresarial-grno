import { formatNumberPtBr } from "@/lib/format/number";
import type { CsvColumn } from "@/lib/export/csv";
import type { PmeBsodRow } from "@/lib/queries/bsod";

export const BSOD_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "monitor_label", label: "STATUS" },
  { key: "ope", label: "OPE" },
  { key: "cmts", label: "CMTS" },
  { key: "node", label: "NODE" },
  { key: "mac", label: "MAC" },
  { key: "contrato", label: "CONTRATO" },
  { key: "profile", label: "PROFILE" },
  { key: "bsod_vlan", label: "VLAN BSOD" },
  {
    key: "tx",
    label: "TX",
    format: (value) => formatBsodMetric(value),
  },
  {
    key: "rx",
    label: "RX",
    format: (value) => formatBsodMetric(value),
  },
  {
    key: "mer",
    label: "MER",
    format: (value) => formatBsodMetric(value),
  },
  { key: "monitor_time", label: "ÚLTIMA LEITURA" },
];

/** Formata métrica numérica BSOD para CSV. */
function formatBsodMetric(value: unknown): string {
  if (value == null || value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return formatNumberPtBr(numeric, { maximumFractionDigits: 2 });
}

/** Converte linhas BSOD tipadas para exportação CSV. */
export function bsodRowsForExport(rows: PmeBsodRow[]): Record<string, unknown>[] {
  return rows as Record<string, unknown>[];
}
