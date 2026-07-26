type RelatorioColumnChartPoint = {
  label: string;
  value: number;
};

type RelatorioColumnChartProps = {
  points: RelatorioColumnChartPoint[];
  empty?: string;
};

/** Gráfico de colunas verticais para série temporal. */
export function RelatorioColumnChart({ points, empty = "Sem dados." }: RelatorioColumnChartProps) {
  if (points.length === 0) {
    return <p className="relatorio-column-chart__empty">{empty}</p>;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="relatorio-column-chart">
      <div className="relatorio-column-chart__plot" role="img" aria-label="Gráfico de colunas">
        {points.map((point) => {
          const height = Math.max(8, Math.round((point.value / maxValue) * 100));
          return (
            <div key={point.label} className="relatorio-column-chart__column-wrap">
              <span className="relatorio-column-chart__value">{point.value}</span>
              <div className="relatorio-column-chart__track">
                <span className="relatorio-column-chart__bar" style={{ height: `${height}%` }} />
              </div>
              <span className="relatorio-column-chart__label">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
