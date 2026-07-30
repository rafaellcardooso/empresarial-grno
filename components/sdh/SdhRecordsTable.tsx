"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SdhDetalhesPanel } from "@/components/sdh/SdhDetalhesPanel";
import { TratativaPanel } from "@/components/tratativa/TratativaPanel";
import { TratativaTreatButton } from "@/components/tratativa/TratativaTreatButton";
import { SortableDataTable } from "@/components/ui/SortableDataTable";
import { SDH_TABLE_COLUMNS } from "@/lib/config/sdh-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type SdhRecordsTableProps = {
  rows: SdhAlarmListItem[];
  empty?: string;
};

/** Tabela SDH prioritária com painel unificado de tratativa. */
export function SdhRecordsTable({
  rows,
  empty = "Nenhum alarme SDH ativo para os filtros selecionados.",
}: SdhRecordsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SdhAlarmListItem | null>(null);
  const [treatId, setTreatId] = useState<string | null>(null);
  const tableRows = rows.map((row) => ({ ...row })) as Record<string, unknown>[];

  const handlePanelChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!selected && !treatId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        setTreatId(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, treatId]);

  return (
    <>
      <SortableDataTable
        columns={SDH_TABLE_COLUMNS}
        rows={tableRows}
        empty={empty}
        defaultSort={{ key: "data_alarme", direction: "desc" }}
        sortTieBreakers={["id"]}
        renderCell={(key, value, row) => {
          const alarm = row as unknown as SdhAlarmListItem;
          if (key === "tratativa_status") {
            const active = Number(alarm.em_tratativa) === 1;
            return (
              <span
                className={`tratativa-workflow-badge ${
                  active
                    ? "tratativa-workflow-badge--em-tratativa"
                    : "tratativa-workflow-badge--pendente"
                }`}
                title={
                  active
                    ? `${alarm.tratativa_user_login ?? "—"} · ${formatDateTimePtBr(
                        typeof alarm.tratativa_marked_at === "string"
                          ? alarm.tratativa_marked_at
                          : null,
                      )}`
                    : "Sem tratativa ativa"
                }
              >
                {active ? "Em tratativa" : "Pendente"}
              </span>
            );
          }
          if (key === "tratativa_actions") {
            return <TratativaTreatButton onClick={() => setTreatId(String(alarm.id))} />;
          }
          if (key === "detalhes") {
            return (
              <button
                type="button"
                className="sir-detalhes-btn"
                onClick={() => setSelected(alarm)}
                aria-label={`${UI_COPY.sirViewDetails} ${alarm.ne ?? alarm.id}`}
                title={UI_COPY.sirViewDetails}
              >
                <i className="bi bi-eye" aria-hidden="true" />
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

      <SdhDetalhesPanel
        open={selected != null}
        alarm={selected}
        onClose={() => setSelected(null)}
      />
      <TratativaPanel
        open={treatId != null}
        domain="SDH"
        recordKey={treatId}
        onClose={() => setTreatId(null)}
        onChanged={handlePanelChanged}
      />
    </>
  );
}
