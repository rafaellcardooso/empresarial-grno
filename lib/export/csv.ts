export type CsvColumn<T extends Record<string, unknown>> = {
  key: string;
  label: string;
  format?: (value: unknown, row: T) => string;
};

/** Escapa valor para célula CSV (delimitador ponto e vírgula). */
function escapeCsvCell(value: string): string {
  if (/[;\r\n"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Formata célula CSV a partir do valor bruto ou formatter customizado. */
function formatCsvCell<T extends Record<string, unknown>>(row: T, column: CsvColumn<T>): string {
  const raw = row[column.key];
  const text = column.format ? column.format(raw, row) : formatCsvValue(raw);
  return escapeCsvCell(text);
}

/** Converte valor desconhecido em texto CSV. */
function formatCsvValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Serializa linhas tabulares em CSV UTF-8 com BOM para Excel. */
export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(";");
  const body = rows.map((row) => columns.map((column) => formatCsvCell(row, column)).join(";"));
  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

/** Monta nome de arquivo CSV com prefixo e data local. */
export function buildCsvFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
