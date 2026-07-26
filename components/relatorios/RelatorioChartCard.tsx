import type { ReactNode } from "react";
import { ContentCard } from "@/components/ui/ContentCard";

type RelatorioChartCardProps = {
  title: string;
  lead?: string;
  icon: string;
  children: ReactNode;
};

/** Card de gráfico com ícone no cabeçalho. */
export function RelatorioChartCard({ title, lead, icon, children }: RelatorioChartCardProps) {
  return (
    <ContentCard
      title={title}
      bodyClassName="p-3 relatorio-chart-card__body"
      headerAside={
        <span className="relatorio-chart-card__icon" aria-hidden="true">
          <i className={`bi ${icon}`} />
        </span>
      }
    >
      {lead ? <p className="relatorio-chart-card__lead">{lead}</p> : null}
      {children}
    </ContentCard>
  );
}
