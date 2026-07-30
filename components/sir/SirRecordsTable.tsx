"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RalTipoBadge } from "@/components/sir/RalTipoBadge";
import { SirDetalhesPanel } from "@/components/sir/SirDetalhesPanel";
import { SirStatusBadge } from "@/components/sir/SirStatusBadge";
import { TratativaPanel } from "@/components/tratativa/TratativaPanel";
import { TratativaStatusCell } from "@/components/tratativa/TratativaStandardCells";
import { TratativaTreatButton } from "@/components/tratativa/TratativaTreatButton";
import { formatDateTimeDisplay } from "@/components/ui/DateTimeStacked";
import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type SirRecordsTableProps = {
  columns: SortableColumn[];
  rows: Record<string, unknown>[];
  recordLabel: "RAL" | "REC";
  tratativasByKey?: Record<string, TratativaPublic>;
  empty?: string;
};

type SelectedDetalhes = {
  numRecup: string;
  row: Record<string, unknown>;
  text: string;
  loading: boolean;
};

const DETALHES_KEYS = new Set(["detalhes", "detalhes_title"]);

/** Tabela SIR prioritária com painel unificado de tratativa. */
export function SirRecordsTable({
  columns,
  rows,
  recordLabel,
  tratativasByKey = {},
  empty,
}: SirRecordsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedDetalhes | null>(null);
  const [treatKey, setTreatKey] = useState<string | null>(null);
  const [tratativas, setTratativas] = useState(tratativasByKey);

  useEffect(() => {
    setTratativas(tratativasByKey);
  }, [tratativasByKey]);

  const handlePanelChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  /** Carrega detalhes completos sob demanda. */
  const openDetalhes = useCallback(
    async (numRecup: string, row: Record<string, unknown>) => {
      setSelected({ numRecup, row, text: "", loading: true });

      try {
        const segment = recordLabel === "RAL" ? "rals" : "recs";
        const response = await fetch(`/api/sir/${segment}/${encodeURIComponent(numRecup)}`);
        const payload = (await response.json()) as {
          data?: Record<string, unknown>;
        };
        const text =
          recordLabel === "RAL"
            ? String(payload.data?.detalhes ?? "—")
            : String(payload.data?.detalhes_title ?? "—");

        setSelected({
          numRecup,
          row: { ...row, ...(payload.data ?? {}) },
          text,
          loading: false,
        });
      } catch {
        setSelected({
          numRecup,
          row,
          text: "Não foi possível carregar os detalhes.",
          loading: false,
        });
      }
    },
    [recordLabel],
  );

  useEffect(() => {
    if (!selected && !treatKey) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        setTreatKey(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, treatKey]);

  return (
    <>
      <SortableDataTable
        className="sortable-data-table--sir"
        columns={columns}
        rows={rows}
        empty={empty}
        renderCell={(key, value, row) =>
          renderSirCell(key, value, row, openDetalhes, recordLabel, tratativas, setTreatKey)
        }
      />

      <SirDetalhesPanel
        open={selected != null}
        recordLabel={recordLabel}
        numRecup={selected?.numRecup ?? ""}
        row={selected?.row ?? null}
        text={selected?.loading ? "Carregando…" : (selected?.text ?? "")}
        onClose={() => setSelected(null)}
      />
      <TratativaPanel
        open={treatKey != null}
        domain={recordLabel}
        recordKey={treatKey}
        onClose={() => setTreatKey(null)}
        onChanged={handlePanelChanged}
      />
    </>
  );
}

function renderSirCell(
  key: string,
  value: unknown,
  row: Record<string, unknown>,
  onOpen: (numRecup: string, row: Record<string, unknown>) => void,
  recordLabel: "RAL" | "REC",
  tratativas: Record<string, TratativaPublic>,
  onTreat: (recordKey: string) => void,
) {
  const recordKey = String(row.num_recup ?? "");
  const normalizedKey = normalizeTratativaKey(recordLabel, recordKey);
  const tratativa = tratativas[normalizedKey] ?? null;
  const isRecordOpen =
    String(row.status ?? "")
      .trim()
      .toUpperCase() === "ATIVO";

  if (key === "abertura" || key === "ultima_atualizacao") {
    return formatDateTimeDisplay(value as string | null);
  }
  if (key === "tipo_ral") {
    return <RalTipoBadge value={value as string | null} />;
  }
  if (key === "status") {
    return <SirStatusBadge value={value as string | null} />;
  }
  if (key === "tratativa_status") {
    return <TratativaStatusCell tratativa={tratativa} isRecordOpen={isRecordOpen} />;
  }
  if (key === "tratativa_actions") {
    if (!isRecordOpen) return "—";
    return <TratativaTreatButton onClick={() => onTreat(recordKey)} />;
  }
  if (DETALHES_KEYS.has(key)) {
    if (!row.has_detalhes) return "—";
    return (
      <button
        type="button"
        className="sir-detalhes-btn"
        onClick={() => onOpen(recordKey, row)}
        aria-label={`${UI_COPY.sirViewDetails} ${recordKey}`}
        title={UI_COPY.sirViewDetails}
      >
        <i className="bi bi-eye" aria-hidden="true" />
      </button>
    );
  }
  if (value == null || value === "") return "—";
  return String(value);
}
