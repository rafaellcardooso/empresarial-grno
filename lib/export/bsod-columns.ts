import { formatNumberPtBr } from "@/lib/format/number";
import type { CsvColumn } from "@/lib/export/csv";
import type { PmeBsodRow } from "@/lib/queries/bsod";

export const BSOD_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "monitor_label", label: "STATUS SNMP" },
  { key: "ope_label", label: "OPERAÇÃO" },
  { key: "cmts", label: "CMTS" },
  { key: "node", label: "NODE" },
  { key: "mac", label: "MAC" },
  { key: "contrato", label: "CONTRATO" },
  { key: "cliente", label: "CLIENTE" },
  { key: "cadastro_responsavel", label: "CADASTRO RESPONSÁVEL" },
  { key: "designacao", label: "DESIGNAÇÃO" },
  { key: "produto", label: "PRODUTO" },
  { key: "profile", label: "PROFILE" },
  { key: "address", label: "ENDEREÇO" },
  { key: "bsod_vlan", label: "VLAN CMTS" },
  { key: "crm_cvlan", label: "CVLAN CRM" },
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
  { key: "monitor_time", label: "ATUALIZADO EM" },
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
