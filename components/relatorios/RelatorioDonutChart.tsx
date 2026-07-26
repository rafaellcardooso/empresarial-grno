type RelatorioDonutSlice = {
  label: string;
  value: number;
  tone: "default" | "success" | "danger" | "warning" | "info";
};

type RelatorioDonutChartProps = {
  slices: RelatorioDonutSlice[];
  centerLabel?: string;
  empty?: string;
};

const SLICE_COLOR: Record<RelatorioDonutSlice["tone"], string> = {
  default: "#e30613",
  success: "#198754",
  danger: "#dc3545",
  warning: "#b58100",
  info: "#0d6efd",
};

/** Monta gradiente cônico para o donut. */
function buildDonutGradient(slices: RelatorioDonutSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let accumulated = 0;

  const stops = slices.map((slice) => {
    const start = (accumulated / total) * 100;
    accumulated += slice.value;
    const end = (accumulated / total) * 100;
    return `${SLICE_COLOR[slice.tone]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

/** Gráfico donut com legenda lateral. */
export function RelatorioDonutChart({
  slices,
  centerLabel = "Total",
  empty = "Sem dados.",
}: RelatorioDonutChartProps) {
  const filtered = slices.filter((slice) => slice.value > 0);
  if (filtered.length === 0) {
    return <p className="relatorio-donut-chart__empty">{empty}</p>;
  }

  const total = filtered.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="relatorio-donut-chart">
      <div
        className="relatorio-donut-chart__ring"
        style={{ background: buildDonutGradient(filtered) }}
        aria-hidden="true"
      >
        <div className="relatorio-donut-chart__hole">
          <span className="relatorio-donut-chart__total">{total}</span>
          <span className="relatorio-donut-chart__caption">{centerLabel}</span>
        </div>
      </div>

      <ul className="relatorio-donut-chart__legend">
        {filtered.map((slice) => (
          <li key={slice.label} className="relatorio-donut-chart__legend-item">
            <span
              className="relatorio-donut-chart__swatch"
              style={{ backgroundColor: SLICE_COLOR[slice.tone] }}
              aria-hidden="true"
            />
            <span className="relatorio-donut-chart__legend-label">{slice.label}</span>
            <span className="relatorio-donut-chart__legend-value">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
