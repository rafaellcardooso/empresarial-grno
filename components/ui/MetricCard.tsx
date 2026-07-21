type MetricCardProps = {
  label: string;
  value: string | number;
};

/** Card compacto com métrica numérica centralizada. */
export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body text-center">
        <div className="metric-card__label text-body-secondary mb-1">{label}</div>
        <div className="metric-card__value mb-0">{value}</div>
      </div>
    </div>
  );
}
