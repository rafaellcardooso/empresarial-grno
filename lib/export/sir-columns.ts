import type { CsvColumn } from "@/lib/export/csv";

const sharedFormatters = {
  plain: (value: unknown) => (value == null || value === "" ? "" : String(value)),
};

export const RAL_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "num_recup", label: "Nº", format: sharedFormatters.plain },
  { key: "status", label: "STATUS", format: sharedFormatters.plain },
  { key: "tipo_ral", label: "TIPO", format: sharedFormatters.plain },
  { key: "cf_executante", label: "CF", format: sharedFormatters.plain },
  { key: "descricao", label: "DESIGNAÇÃO", format: sharedFormatters.plain },
  { key: "abertura", label: "ABERTURA", format: sharedFormatters.plain },
  { key: "duracao", label: "DURAÇÃO", format: sharedFormatters.plain },
  { key: "ultima_atualizacao", label: "ATUALIZAÇÃO", format: sharedFormatters.plain },
];

export const REC_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "num_recup", label: "Nº", format: sharedFormatters.plain },
  { key: "status", label: "STATUS", format: sharedFormatters.plain },
  { key: "prioridade", label: "PRIORIDADE", format: sharedFormatters.plain },
  { key: "cliente", label: "CLIENTE", format: sharedFormatters.plain },
  { key: "designacao", label: "DESIGNAÇÃO", format: sharedFormatters.plain },
  { key: "cf_executante", label: "CF", format: sharedFormatters.plain },
  { key: "abertura", label: "ABERTURA", format: sharedFormatters.plain },
  { key: "ultima_atualizacao", label: "ATUALIZAÇÃO", format: sharedFormatters.plain },
];
