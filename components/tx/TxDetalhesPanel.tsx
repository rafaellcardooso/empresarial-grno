"use client";

import { useEffect } from "react";
import { TxDirectionCard, TxEndpointCard } from "@/components/tx/TxDetalhesCards";
import { TxHistorySection } from "@/components/tx/TxHistorySection";
import { parseTxDesignacao } from "@/lib/config/tx-optical";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatExtensaoKm } from "@/lib/format/tx-optical";
import type { TxOpticalSpan } from "@/lib/models/tx";

type TxDetalhesPanelProps = {
  open: boolean;
  span: TxOpticalSpan | null;
  onClose: () => void;
};

/** Drawer lateral com potências e perdas ópticas do enlace TX. */
export function TxDetalhesPanel({ open, span, onClose }: TxDetalhesPanelProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const parts = span ? parseTxDesignacao(span.designacao) : null;

  return (
    <>
      <div
        className={`offcanvas offcanvas-end sir-detalhes-offcanvas tx-detalhes-offcanvas${open ? " show" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detalhes-panel-title"
        aria-hidden={!open}
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">TX · potência óptica</p>
            <h2 className="offcanvas-title h5 mb-0" id="tx-detalhes-panel-title">
              {parts?.rota || span?.designacao || "—"}
            </h2>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="offcanvas-body">{span ? <TxDetalhesBody span={span} /> : null}</div>
      </div>

      {open ? (
        <div
          className="offcanvas-backdrop fade show sir-detalhes-offcanvas-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      ) : null}
    </>
  );
}

/** Corpo do drawer com identificação e métricas ópticas por sentido. */
function TxDetalhesBody({ span }: { span: TxOpticalSpan }) {
  const parts = parseTxDesignacao(span.designacao);
  const lastSeen =
    formatDateTimePtBr(
      typeof span.last_seen_at === "string"
        ? span.last_seen_at
        : (span.last_seen_at?.toISOString() ?? null),
    ) || "—";

  return (
    <div className="tx-detalhes">
      <section className="tx-detalhes__summary">
        <p className="tx-detalhes__designacao" title={span.designacao}>
          {span.designacao}
        </p>
        <div className="tx-detalhes__chips">
          <span className="tx-detalhes__chip">{span.ufs || "—"}</span>
          <span className="tx-detalhes__chip">{formatExtensaoKm(parts.extensaoKm)} km</span>
          {parts.empresa ? <span className="tx-detalhes__chip">{parts.empresa}</span> : null}
          <span className="tx-detalhes__chip tx-detalhes__chip--muted">Coleta {lastSeen}</span>
        </div>
      </section>

      <section className="tx-detalhes__endpoints">
        <TxEndpointCard side="A" node={span.node_a} port={span.port_a} />
        <TxEndpointCard side="B" node={span.node_b} port={span.port_b} />
      </section>

      <TxDirectionCard
        title="Ponta A"
        subtitle="A → B"
        txLabel="TX A"
        txValue={span.txpower_a}
        rxLabel="RX B"
        rxValue={span.rxpower_b}
        spanLossLabel="Span Loss A"
        spanLossValue={span.span_loss_a_to_b}
        refLabel="Ref Span A"
        refValue={span.ref_span_loss_a_to_b}
        difValue={span.dif_ref_span_loss_a_to_b}
      />

      <TxDirectionCard
        title="Ponta B"
        subtitle="B → A"
        txLabel="TX B"
        txValue={span.txpower_b}
        rxLabel="RX A"
        rxValue={span.rxpower_a}
        spanLossLabel="Span Loss B"
        spanLossValue={span.span_loss_b_to_a}
        refLabel="Ref Span B"
        refValue={span.ref_span_loss_b_to_a}
        difValue={span.dif_ref_span_loss_b_to_a}
      />

      <TxHistorySection designacao={span.designacao} />
    </div>
  );
}
