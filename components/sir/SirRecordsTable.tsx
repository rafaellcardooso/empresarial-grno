"use client";

import { useEffect, useState } from "react";
import { RalTipoBadge } from "@/components/sir/RalTipoBadge";
import { SirDetalhesPanel } from "@/components/sir/SirDetalhesPanel";
import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import { UI_COPY } from "@/lib/config/ui-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type SirRecordsTableProps = {
  columns: SortableColumn[];
  rows: Record<string, unknown>[];
  recordLabel: "RAL" | "REC";
  empty?: string;
};

type SelectedDetalhes = {
  numRecup: string;
  text: string;
};

const DETALHES_KEYS = new Set(["detalhes", "detalhes_title"]);

/** Tabela SIR ordenável com painel lateral para detalhes. */
export function SirRecordsTable({ columns, rows, recordLabel, empty }: SirRecordsTableProps) {
  const [selected, setSelected] = useState<SelectedDetalhes | null>(null);

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
        renderCell={(key, value, row) => renderSirCell(key, value, row, setSelected)}
      />

      <SirDetalhesPanel
        open={selected != null}
        recordLabel={recordLabel}
        numRecup={selected?.numRecup ?? ""}
        text={selected?.text ?? ""}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function renderSirCell(
  key: string,
  value: unknown,
  row: Record<string, unknown>,
  onOpen: (detail: SelectedDetalhes) => void,
) {
  if (key === "abertura" || key === "ultima_atualizacao") {
    return formatDateTimePtBr(value as string | null);
  }
  if (key === "tipo_ral") {
    return <RalTipoBadge value={value as string | null} />;
  }
  if (DETALHES_KEYS.has(key)) {
    if (value == null || value === "") return "—";
    const numRecup = String(row.num_recup ?? "");
    return (
      <button
        type="button"
        className="btn btn-sm btn-light sir-detalhes-btn"
        onClick={() => onOpen({ numRecup, text: String(value) })}
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
