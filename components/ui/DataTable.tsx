import { UI_COPY } from "@/lib/config/ui-copy";

export type TableColumn = {
  key: string;
  label: string;
};

type DataTableProps = {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  empty?: string;
};

/** Renderiza tabela responsiva a partir de colunas e linhas genéricas. */
export function DataTable({
  columns,
  rows,
  empty = UI_COPY.emptyDefault,
}: DataTableProps) {
  if (!rows.length) {
    return <p className="text-body-secondary mb-0 px-3 py-3">{empty}</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="sortable-data-table__th">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.num_recup ?? row.mac ?? row.id ?? index)}>
              {columns.map((column) => (
                <td key={column.key} className="text-break" style={{ maxWidth: 280 }}>
                  {formatCellValue(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Formata valor de célula para exibição na tabela. */
function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
