"use client";

import { useCallback, useEffect, useState } from "react";
import { RalTipoBadge } from "@/components/sir/RalTipoBadge";
import { SirDetalhesPanel } from "@/components/sir/SirDetalhesPanel";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import { UI_COPY } from "@/lib/config/ui-copy";

type SirRecordsTableProps = {
  columns: SortableColumn[];
  rows: Record<string, unknown>[];
  recordLabel: "RAL" | "REC";
  empty?: string;
};

type SelectedDetalhes = {
  numRecup: string;
  text: string;
  loading: boolean;
};

const DETALHES_KEYS = new Set(["detalhes", "detalhes_title"]);

/** Tabela SIR ordenável com painel lateral para detalhes. */
export function SirRecordsTable({ columns, rows, recordLabel, empty }: SirRecordsTableProps) {
  const [selected, setSelected] = useState<SelectedDetalhes | null>(null);

  /** Carrega detalhes completos sob demanda. */
  const openDetalhes = useCallback(
    async (numRecup: string) => {
      setSelected({ numRecup, text: "", loading: true });

      try {
        const segment = recordLabel === "RAL" ? "rals" : "recs";
        const response = await fetch(`/api/sir/${segment}/${encodeURIComponent(numRecup)}`);
        const payload = (await response.json()) as {
          data?: { detalhes?: string | null; detalhes_title?: string | null };
        };
        const text =
          recordLabel === "RAL"
            ? (payload.data?.detalhes ?? "—")
            : (payload.data?.detalhes_title ?? "—");

        setSelected({ numRecup, text: String(text), loading: false });
      } catch {
        setSelected({ numRecup, text: "Não foi possível carregar os detalhes.", loading: false });
      }
    },
    [recordLabel],
  );

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      <SortableDataTable
        className="sortable-data-table--sir"
        columns={columns}
        rows={rows}
        empty={empty}
        renderCell={(key, value, row) => renderSirCell(key, value, row, openDetalhes)}
      />

      <SirDetalhesPanel
        open={selected != null}
        recordLabel={recordLabel}
        numRecup={selected?.numRecup ?? ""}
        text={selected?.loading ? "Carregando…" : (selected?.text ?? "")}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function renderSirCell(
  key: string,
  value: unknown,
  row: Record<string, unknown>,
  onOpen: (numRecup: string) => void,
) {
  if (key === "abertura" || key === "ultima_atualizacao") {
    return <DateTimeStacked value={value as string | null} />;
  }
  if (key === "tipo_ral") {
    return <RalTipoBadge value={value as string | null} />;
  }
  if (DETALHES_KEYS.has(key)) {
    if (!row.has_detalhes) return "—";
    const numRecup = String(row.num_recup ?? "");
    return (
      <button
        type="button"
        className="sir-detalhes-btn"
        onClick={() => onOpen(numRecup)}
        aria-label={`${UI_COPY.sirViewDetails} ${numRecup}`}
        title={UI_COPY.sirViewDetails}
      >
        <i className="bi bi-eye" aria-hidden="true" />
      </button>
    );
  }
  if (value == null || value === "") return "—";
  return String(value);
}
