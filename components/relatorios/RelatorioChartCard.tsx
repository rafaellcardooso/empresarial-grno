import type { ReactNode } from "react";

type RelatorioChartCardProps = {
  title: string;
  lead?: string;
  icon: string;
  children: ReactNode;
};

/** Card de gráfico com superfície padronizada do dashboard de relatórios. */
export function RelatorioChartCard({ title, lead, icon, children }: RelatorioChartCardProps) {
  return (
    <article className="relatorio-chart-card">
      <header className="relatorio-chart-card__head">
        <div className="relatorio-chart-card__copy">
          <h3 className="relatorio-chart-card__title">{title}</h3>
          {lead ? <p className="relatorio-chart-card__lead">{lead}</p> : null}
        </div>
        <span className="relatorio-chart-card__icon" aria-hidden="true">
          <i className={`bi ${icon}`} />
        </span>
      </header>
      <div className="relatorio-chart-card__body">{children}</div>
    </article>
  );
}
