type RelatorioInsightKpiProps = {
  icon: string;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "primary" | "warning" | "success" | "info";
};

const TONE_CLASS: Record<NonNullable<RelatorioInsightKpiProps["tone"]>, string> = {
  primary: "relatorio-insight-kpi--primary",
  warning: "relatorio-insight-kpi--warning",
  success: "relatorio-insight-kpi--success",
  info: "relatorio-insight-kpi--info",
};

/** KPI visual do dashboard de relatórios. */
export function RelatorioInsightKpi({
  icon,
  label,
  value,
  hint,
  tone = "primary",
}: RelatorioInsightKpiProps) {
  return (
    <article className={`relatorio-insight-kpi ${TONE_CLASS[tone]}`}>
      <div className="relatorio-insight-kpi__icon" aria-hidden="true">
        <i className={`bi ${icon}`} />
      </div>
      <div className="relatorio-insight-kpi__body">
        <p className="relatorio-insight-kpi__label">{label}</p>
        <p className="relatorio-insight-kpi__value">{value}</p>
        {hint ? <p className="relatorio-insight-kpi__hint">{hint}</p> : null}
      </div>
    </article>
  );
}
