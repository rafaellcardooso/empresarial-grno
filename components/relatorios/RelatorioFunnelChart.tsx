type RelatorioFunnelStep = {
  key: string;
  label: string;
  value: number;
  tone: "default" | "success" | "danger" | "warning";
};

type RelatorioFunnelChartProps = {
  steps: RelatorioFunnelStep[];
  empty?: string;
};

const TONE_CLASS: Record<RelatorioFunnelStep["tone"], string> = {
  default: "relatorio-funnel-chart__bar--default",
  success: "relatorio-funnel-chart__bar--success",
  danger: "relatorio-funnel-chart__bar--danger",
  warning: "relatorio-funnel-chart__bar--warning",
};

/** Funil visual das etapas operacionais da tratativa. */
export function RelatorioFunnelChart({ steps, empty = "Sem dados." }: RelatorioFunnelChartProps) {
  if (steps.length === 0) {
    return <p className="relatorio-funnel-chart__empty">{empty}</p>;
  }

  const base = steps[0]?.value || 1;

  return (
    <div className="relatorio-funnel-chart">
      {steps.map((step, index) => {
        const width = Math.max(12, Math.round((step.value / base) * 100));
        const prev = index > 0 ? steps[index - 1].value : null;
        const conversion =
          prev != null && prev > 0
            ? `${Math.round((step.value / prev) * 100)}% da etapa anterior`
            : null;

        return (
          <div key={step.key} className="relatorio-funnel-chart__step">
            <div className="relatorio-funnel-chart__meta">
              <span className="relatorio-funnel-chart__label">{step.label}</span>
              {conversion ? (
                <span className="relatorio-funnel-chart__conversion">{conversion}</span>
              ) : null}
            </div>
            <div className="relatorio-funnel-chart__track">
              <span
                className={`relatorio-funnel-chart__bar ${TONE_CLASS[step.tone]}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="relatorio-funnel-chart__value">{step.value}</span>
          </div>
        );
      })}
    </div>
  );
}
