"use client";

import { useEffect, useState } from "react";
import { TxDetalhesPanel } from "@/components/tx/TxDetalhesPanel";
import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { SortableDataTable } from "@/components/ui/SortableDataTable";
import { parseTxDesignacao } from "@/lib/config/tx-optical";
import { TX_TABLE_COLUMNS } from "@/lib/config/tx-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import { formatExtensaoKm } from "@/lib/format/tx-optical";
import type { TxOpticalSpan } from "@/lib/models/tx";

type TxRecordsTableProps = {
  rows: TxOpticalSpan[];
  empty?: string;
};

/** Empilha ponta A (acima) e B (abaixo) com NODE e PORTA alinhados em colunas. */
function TxEndpointsCell({
  nodeA,
  portA,
  nodeB,
  portB,
}: {
  nodeA: unknown;
  portA: unknown;
  nodeB: unknown;
  portB: unknown;
}) {
  return (
    <div className="tx-endpoints-stack">
      <span className="tx-endpoints-stack__side">A</span>
      <span className="tx-endpoints-stack__node">{String(nodeA ?? "").trim() || "—"}</span>
      <span className="tx-endpoints-stack__sep" aria-hidden="true" />
      <span className="tx-endpoints-stack__port">{String(portA ?? "").trim() || "—"}</span>
      <span className="tx-endpoints-stack__side">B</span>
      <span className="tx-endpoints-stack__node">{String(nodeB ?? "").trim() || "—"}</span>
      <span className="tx-endpoints-stack__sep" aria-hidden="true" />
      <span className="tx-endpoints-stack__port">{String(portB ?? "").trim() || "—"}</span>
    </div>
  );
}

/** Tabela de enlaces ópticos TX com DIF_REF na listagem e drawer de detalhes. */
export function TxRecordsTable({
  rows,
  empty = "Nenhum enlace óptico para os filtros selecionados.",
}: TxRecordsTableProps) {
  const [selected, setSelected] = useState<TxOpticalSpan | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const tableRows = rows.map((row) => {
    const parts = parseTxDesignacao(row.designacao);
    return {
      ...row,
      rota: parts.rota,
      extensao_km: parts.extensaoKm,
      empresa: parts.empresa,
      endpoints: `${row.node_a} ${row.port_a} ${row.node_b} ${row.port_b}`,
    };
  }) as Record<string, unknown>[];

  return (
    <>
      <SortableDataTable
        columns={TX_TABLE_COLUMNS}
        rows={tableRows}
        empty={empty}
        defaultSort={{ key: "rota", direction: "asc" }}
        sortTieBreakers={["designacao"]}
        renderCell={(key, value, row) => {
          const span = row as unknown as TxOpticalSpan;
          if (key === "rota") {
            return (
              <span className="tx-nowrap-cell" title={String(row.designacao ?? "")}>
                {String(value || "—")}
              </span>
            );
          }
          if (key === "extensao_km") return formatExtensaoKm(value);
          if (key === "empresa") return value ? String(value) : "—";
          if (key === "endpoints") {
            return (
              <TxEndpointsCell
                nodeA={row.node_a}
                portA={row.port_a}
                nodeB={row.node_b}
                portB={row.port_b}
              />
            );
          }
          if (key === "dif_ref_span_loss_a_to_b" || key === "dif_ref_span_loss_b_to_a") {
            return <TxDifRefValue value={value} />;
          }
          if (key === "detalhes") {
            return (
              <button
                type="button"
                className="sir-detalhes-btn"
                onClick={() => setSelected(span)}
                aria-label={`${UI_COPY.sirViewDetails} ${partsRota(span)}`}
                title={UI_COPY.sirViewDetails}
              >
                <i className="bi bi-eye" aria-hidden="true" />
              </button>
            );
          }
          if (value == null || value === "") return "—";
          return String(value);
        }}
      />

      <TxDetalhesPanel open={selected != null} span={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/** Rótulo curto da rota para acessibilidade do botão de detalhes. */
function partsRota(span: TxOpticalSpan): string {
  return parseTxDesignacao(span.designacao).rota || span.designacao;
}
