"use client";

import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import { formatDateTimePtBr } from "@/lib/format/datetime";

const COLUMNS: SortableColumn[] = [
  { key: "ddd", label: "DDD", sortable: true, nowrap: true },
  { key: "municipio", label: "MUNICÍPIO", sortable: true },
  { key: "ne", label: "NE", sortable: true },
  { key: "porta", label: "PORTA", sortable: true, nowrap: true, width: "16rem" },
  { key: "alarme", label: "ALARME", sortable: true },
  { key: "circuito", label: "CIRCUITO", sortable: true },
  { key: "data_alarme", label: "DATA ALARME", sortable: true, nowrap: true },
  { key: "tratativa_observacao", label: "OBSERVAÇÃO", sortable: false },
  { key: "tratativa_user_login", label: "LOGIN", sortable: true, nowrap: true },
  { key: "status", label: "STATUS", sortable: false, nowrap: true, width: "7rem" },
];

type SdhRecordsTableProps = {
  rows: SdhAlarmListItem[];
  empty?: string;
  onStatusClick: (alarm: SdhAlarmListItem) => void;
};

/** Tabela ordenável de alarmes SDH com coluna STATUS. */
export function SdhRecordsTable({
  rows,
  empty = "Nenhum alarme SDH ativo para os filtros selecionados.",
  onStatusClick,
}: SdhRecordsTableProps) {
  const tableRows = rows.map((row) => ({ ...row })) as Record<string, unknown>[];

  return (
    <SortableDataTable
      columns={COLUMNS}
      rows={tableRows}
      empty={empty}
      defaultSort={{ key: "data_alarme", direction: "desc" }}
      sortTieBreakers={["id"]}
      renderCell={(key, value, row) => {
        if (key === "status") {
          const alarm = row as unknown as SdhAlarmListItem;
          const active = Number(alarm.em_tratativa) === 1;
          return (
            <button
              type="button"
              className={`btn btn-sm ${active ? "btn-warning" : "btn-outline-secondary"}`}
              title={
                active
                  ? `${alarm.tratativa_user_login ?? "—"} · ${formatDateTimePtBr(
                      typeof alarm.tratativa_marked_at === "string"
                        ? alarm.tratativa_marked_at
                        : null,
                    )}`
                  : "Marcar em tratativa"
              }
              onClick={() => onStatusClick(alarm)}
            >
              {active ? "Em tratativa" : "STATUS"}
            </button>
          );
        }
        if (key === "data_alarme") {
          return formatDateTimePtBr(typeof value === "string" ? value : null);
        }
        if (key === "ddd") {
          const text = typeof value === "string" ? value.trim() : "";
          return text || "—";
        }
        if (key === "municipio") {
          const text = typeof value === "string" ? value.trim() : "";
          return text ? text.toUpperCase() : "—";
        }
        if (key === "porta") {
          const text = typeof value === "string" ? value.trim() : "";
          if (!text) return "—";
          return (
            <span className="d-block text-truncate" style={{ maxWidth: "16rem" }} title={text}>
              {text}
            </span>
          );
        }
        if (value == null || value === "") return "—";
        return String(value);
      }}
    />
  );
}
