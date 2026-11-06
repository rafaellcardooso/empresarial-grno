"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SdhDetalhesPanel } from "@/components/sdh/SdhDetalhesPanel";
import { TratativaOperatorStack } from "@/components/tratativa/TratativaOperatorStack";
import { TratativaPanel } from "@/components/tratativa/TratativaPanel";
import { TratativaTreatButton } from "@/components/tratativa/TratativaTreatButton";
import { SortableDataTable } from "@/components/ui/SortableDataTable";
import { SDH_TABLE_COLUMNS } from "@/lib/config/sdh-tables";
import {
  TRATATIVA_AWAITING_CONCLUSION_LABEL,
  TRATATIVA_WORKFLOW_LABELS,
} from "@/lib/config/tratativa-workflow";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { hasAcionamentoInCurrentCycle } from "@/lib/tratativa/treatment-types";

type SdhRecordsTableProps = {
  rows: SdhAlarmListItem[];
  variant?: "default" | "normalized";
  empty?: string;
};

/** Tabela SDH prioritária com painel unificado de tratativa. */
export function SdhRecordsTable({
  rows,
  variant = "default",
  empty = "Nenhum alarme SDH ativo para os filtros selecionados.",
}: SdhRecordsTableProps) {
  void variant;
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
            const awaitingConclusion = active && Number(alarm.is_active) !== 1;
            const acionado = hasAcionamentoInCurrentCycle(alarm.tratativa_history ?? []);
            const label = !active
              ? "Pendente"
              : awaitingConclusion
                ? TRATATIVA_AWAITING_CONCLUSION_LABEL
                : acionado
                  ? TRATATIVA_WORKFLOW_LABELS.acionado
                  : TRATATIVA_WORKFLOW_LABELS.em_tratativa;
            const className = !active
              ? "tratativa-workflow-badge tratativa-workflow-badge--pendente"
              : awaitingConclusion
                ? "tratativa-workflow-badge tratativa-workflow-badge--validado"
                : acionado
                  ? "tratativa-workflow-badge tratativa-workflow-badge--acionado"
                  : "tratativa-workflow-badge tratativa-workflow-badge--em-tratativa";
            if (!active) {
              return <span className={className}>{label}</span>;
            }
            return (
              <div className="tratativa-status-cell">
                <span className={className}>{label}</span>
                <TratativaOperatorStack
                  name={alarm.tratativa_user_name}
                  corporateId={alarm.tratativa_user_login}
                />
              </div>
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
