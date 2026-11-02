type RelatorioTimelinePoint = {
  label: string;
  value: number;
};

type RelatorioTimelineChartProps = {
  points: RelatorioTimelinePoint[];
  empty?: string;
};

/** Série temporal densa com barras baixas e resumo de total/pico. */
export function RelatorioTimelineChart({
  points,
  empty = "Sem dados.",
}: RelatorioTimelineChartProps) {
  if (points.length === 0) {
    return <p className="relatorio-timeline-chart__empty">{empty}</p>;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);

  return (
    <div className="relatorio-timeline-chart">
      <div className="relatorio-timeline-chart__summary">
        <span className="relatorio-timeline-chart__chip">
          <span className="relatorio-timeline-chart__chip-label">Total</span>
          <strong>{total}</strong>
        </span>
        <span className="relatorio-timeline-chart__chip relatorio-timeline-chart__chip--peak">
          <span className="relatorio-timeline-chart__chip-label">Pico</span>
          <strong>
            {peak.value}
            <span className="relatorio-timeline-chart__chip-note">· {peak.label}</span>
          </strong>
        </span>
      </div>
      <div
        className="relatorio-timeline-chart__plot"
        role="img"
        aria-label={`Série diária, total ${total}`}
      >
        {points.map((point) => {
          const height =
            point.value <= 0 ? 0 : Math.max(10, Math.round((point.value / maxValue) * 100));
          const isPeak = point.label === peak.label && point.value === peak.value && peak.value > 0;
          return (
            <div
              key={point.label}
              className={`relatorio-timeline-chart__day${isPeak ? " is-peak" : ""}`}
              title={`${point.label}: ${point.value}`}
            >
              <span className="relatorio-timeline-chart__value">
                {point.value > 0 ? point.value : ""}
              </span>
              <div className="relatorio-timeline-chart__track">
                <span
                  className={`relatorio-timeline-chart__bar${point.value <= 0 ? " is-empty" : ""}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="relatorio-timeline-chart__label">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
