"use client";

import { useEffect } from "react";
import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { parseTxDesignacao } from "@/lib/config/tx-optical";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatExtensaoKm, formatOpticalValue } from "@/lib/format/tx-optical";
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
    </div>
  );
}

/** Card compacto de uma ponta (NODE / PORTA). */
function TxEndpointCard({ side, node, port }: { side: "A" | "B"; node: string; port: string }) {
  return (
    <div className="tx-detalhes-endpoint">
      <span className="tx-detalhes-endpoint__side">{side}</span>
      <div className="tx-detalhes-endpoint__body">
        <div className="tx-detalhes-endpoint__row">
          <span className="tx-detalhes-endpoint__label">NODE {side}</span>
          <span className="tx-detalhes-endpoint__node">{node || "—"}</span>
        </div>
        <div className="tx-detalhes-endpoint__row">
          <span className="tx-detalhes-endpoint__label">PORTA {side}</span>
          <span className="tx-detalhes-endpoint__port">{port || "—"}</span>
        </div>
      </div>
    </div>
  );
}

type TxDirectionCardProps = {
  title: string;
  subtitle: string;
  txLabel: string;
  txValue: unknown;
  rxLabel: string;
  rxValue: unknown;
  spanLossLabel: string;
  spanLossValue: unknown;
  refLabel: string;
  refValue: unknown;
  difValue: unknown;
};

/** Card de um sentido óptico com SpanLoss / RefSpan / Diferença em destaque. */
function TxDirectionCard({
  title,
  subtitle,
  txLabel,
  txValue,
  rxLabel,
  rxValue,
  spanLossLabel,
  spanLossValue,
  refLabel,
  refValue,
  difValue,
}: TxDirectionCardProps) {
  return (
    <section className="tx-detalhes-card">
      <header className="tx-detalhes-card__header">
        <h3 className="tx-detalhes-card__title">{title}</h3>
        <span className="tx-detalhes-card__subtitle">{subtitle}</span>
      </header>

      <div className="tx-detalhes-metrics">
        <TxMetric label={spanLossLabel} value={formatOpticalValue(spanLossValue)} />
        <TxMetric label={refLabel} value={formatOpticalValue(refValue)} />
        <div className="tx-detalhes-metric tx-detalhes-metric--dif">
          <span className="tx-detalhes-metric__label">Diferença</span>
          <TxDifRefValue value={difValue} />
        </div>
      </div>

      <div className="tx-detalhes-powers">
        <TxMetric label={txLabel} value={formatOpticalValue(txValue)} compact />
        <TxMetric label={rxLabel} value={formatOpticalValue(rxValue)} compact />
      </div>
    </section>
  );
}

/** Célula de métrica óptica no drawer TX. */
function TxMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`tx-detalhes-metric${compact ? " tx-detalhes-metric--compact" : ""}`}>
      <span className="tx-detalhes-metric__label">{label}</span>
      <span className="tx-detalhes-metric__value">{value}</span>
    </div>
  );
}
