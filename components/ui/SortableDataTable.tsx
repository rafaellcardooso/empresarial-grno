"use client";

import { useMemo, useState, type ReactNode } from "react";
import { UI_COPY } from "@/lib/config/ui-copy";

export type SortableColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
};

type SortableDataTableProps = {
  columns: SortableColumn[];
  rows: Record<string, unknown>[];
  empty?: string;
  className?: string;
  renderCell?: (key: string, value: unknown, row: Record<string, unknown>) => ReactNode;
};

type SortState = {
  key: string;
  direction: "asc" | "desc";
};

/** Tabela com ordenação client-side por coluna. */
export function SortableDataTable({
  columns,
  rows,
  empty = UI_COPY.emptyDefault,
  className,
  renderCell,
}: SortableDataTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.direction));
    return copy;
  }, [rows, sort]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  if (!rows.length) {
    return <p className="text-body-secondary mb-0 px-3 py-3">{empty}</p>;
  }

  return (
    <div className="table-responsive">
      <table
        className={`table table-hover table-striped align-middle mb-0 sortable-data-table${className ? ` ${className}` : ""}`}
      >
        <thead className="table-light">
          <tr>
            {columns.map((column) => {
              const isActive = sort?.key === column.key;
              const sortable = column.sortable !== false;
              return (
                <th key={column.key} className={`sortable-data-table__th ${alignClass(column.align)}`}>
                  {sortable ? (
                    <button
                      type="button"
                      className={`sortable-th-btn sortable-th-btn--${column.align ?? "center"}${isActive ? " sortable-th-btn--active" : ""}`}
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label || "\u00A0"}
                      <span className="sortable-th-indicator" aria-hidden="true">
                        {isActive ? (sort?.direction === "asc" ? " ↑" : " ↓") : " ↕"}
                      </span>
                    </button>
                  ) : (
                    column.label || "\u00A0"
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={String(row.mac ?? row.id ?? index)}>
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td
                    key={column.key}
                    className={`text-break ${alignClass(column.align)}`.trim()}
                    style={{ maxWidth: 280 }}
                  >
                    {renderCell ? renderCell(column.key, value, row) : formatCellValue(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function alignClass(align?: "start" | "center" | "end"): string {
  if (align === "end") return "text-end";
  if (align === "start") return "text-start";
  return "text-center";
}

function compareValues(a: unknown, b: unknown, direction: "asc" | "desc"): number {
  const factor = direction === "asc" ? 1 : -1;
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return (aNum - bNum) * factor;
  }

  const aTime = Date.parse(String(a));
  const bTime = Date.parse(String(b));
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
    return (aTime - bTime) * factor;
  }

  return String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" }) * factor;
}

function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
