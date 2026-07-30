type RelatorioRankedBarItem = {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning";
};

type RelatorioRankedBarChartProps = {
  items: RelatorioRankedBarItem[];
  empty?: string;
};

const TONE_CLASS: Record<NonNullable<RelatorioRankedBarItem["tone"]>, string> = {
  default: "relatorio-bar-chart__bar-fill--default",
  success: "relatorio-bar-chart__bar-fill--success",
  danger: "relatorio-bar-chart__bar-fill--danger",
  warning: "relatorio-bar-chart__bar-fill--warning",
};

/** Ranking numerado com barras horizontais. */
export function RelatorioRankedBarChart({
  items,
  empty = "Sem dados.",
}: RelatorioRankedBarChartProps) {
  if (items.length === 0) {
    return <p className="relatorio-bar-chart__empty">{empty}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div
      className="relatorio-ranked-bar-chart"
      role="region"
      aria-label="Ranking completo"
      tabIndex={0}
    >
      {items.map((item, index) => {
        const width = Math.max(4, Math.round((item.value / maxValue) * 100));
        const tone = item.tone ?? "default";
        return (
          <div key={`${item.label}-${index}`} className="relatorio-ranked-bar-chart__row">
            <span className="relatorio-ranked-bar-chart__rank">{index + 1}</span>
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
