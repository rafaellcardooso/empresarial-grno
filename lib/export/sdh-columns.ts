import type { CsvColumn } from "@/lib/export/csv";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { SdhAlarmListItem } from "@/lib/models/sdh";

export const SDH_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "ddd", label: "DDD" },
  {
    key: "municipio",
    label: "MUNICÍPIO",
    format: (value) => String(value ?? "").toUpperCase(),
  },
  { key: "ne", label: "NE" },
  { key: "porta", label: "PORTA" },
  { key: "alarme", label: "ALARME" },
  { key: "circuito", label: "CIRCUITO" },
  {
    key: "data_alarme",
    label: "DATA ALARME",
    format: (value) => formatDateTimePtBr(typeof value === "string" ? value : undefined),
  },
  { key: "tratativa_observacao", label: "OBSERVAÇÃO" },
  { key: "tratativa_user_login", label: "LOGIN" },
  {
    key: "em_tratativa",
    label: "STATUS",
    format: (value) => (Number(value) === 1 ? "EM TRATATIVA" : "PENDENTE"),
  },
];

/** Converte linhas SDH tipadas para o serializer CSV compartilhado. */
export function sdhRowsForExport(rows: SdhAlarmListItem[]): Record<string, unknown>[] {
  return rows as Record<string, unknown>[];
}
