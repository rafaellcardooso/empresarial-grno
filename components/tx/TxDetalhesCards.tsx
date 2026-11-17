import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { formatOpticalValue } from "@/lib/format/tx-optical";

/** Card compacto de uma ponta (NODE / PORTA). */
export function TxEndpointCard({
  side,
  node,
  port,
}: {
  side: "A" | "B";
  node: string;
  port: string;
}) {
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
export function TxDirectionCard({
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
