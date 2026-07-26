type RelatorioBarChartItem = {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning";
};

type RelatorioBarChartProps = {
  items: RelatorioBarChartItem[];
  empty?: string;
};

const TONE_CLASS: Record<NonNullable<RelatorioBarChartItem["tone"]>, string> = {
  default: "relatorio-bar-chart__bar-fill--default",
  success: "relatorio-bar-chart__bar-fill--success",
  danger: "relatorio-bar-chart__bar-fill--danger",
  warning: "relatorio-bar-chart__bar-fill--warning",
};

/** Gráfico de barras horizontais leve (sem dependência externa). */
export function RelatorioBarChart({ items, empty = "Sem dados." }: RelatorioBarChartProps) {
  if (items.length === 0) {
    return <p className="relatorio-bar-chart__empty">{empty}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="relatorio-bar-chart">
      {items.map((item) => {
        const width = Math.max(4, Math.round((item.value / maxValue) * 100));
        const tone = item.tone ?? "default";
        return (
          <div key={item.label} className="relatorio-bar-chart__row">
            <div className="relatorio-bar-chart__meta">
              <span className="relatorio-bar-chart__label">{item.label}</span>
              {item.hint ? <span className="relatorio-bar-chart__hint">{item.hint}</span> : null}
            </div>
            <div className="relatorio-bar-chart__track" aria-hidden="true">
              <span
                className={`relatorio-bar-chart__bar-fill ${TONE_CLASS[tone]}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="relatorio-bar-chart__value">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
