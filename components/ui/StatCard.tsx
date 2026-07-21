type StatCardProps = {
  context: string;
  label: string;
  value: string | number;
  hint?: string;
  unavailable?: boolean;
};

/** Card de estatística com contexto, rótulo e valor. */
export function StatCard({
  context,
  label,
  value,
  hint,
  unavailable = false,
}: StatCardProps) {
  return (
    <div className={`card h-100 dashboard-stat-card ${unavailable ? "dashboard-stat-card--muted" : ""}`}>
      <div className="card-body">
        <div className="dashboard-stat-context">{context}</div>
        <div className="dashboard-stat-label">{label}</div>
        <div className={`dashboard-stat-value ${unavailable ? "text-body-secondary" : ""}`}>{value}</div>
        {hint ? <p className="text-body-secondary small mb-0 mt-2">{hint}</p> : null}
      </div>
    </div>
  );
}
