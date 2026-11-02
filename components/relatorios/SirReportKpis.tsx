"use client";

import Link from "next/link";
import { buildSirConclusionsHref, buildSirScopeListHref } from "@/lib/config/sir-report-drilldown";
import type {
  SirReportFilters,
  SirReportKpiScopeKey,
  SirReportSummary,
} from "@/lib/models/sir-report";
import { scrollToReportSectionWhenReady } from "@/lib/relatorios/scroll-to-section";

type SirReportKpisProps = {
  summary: SirReportSummary;
  filters: SirReportFilters;
};

/** Resumo por tipo: backlog à esquerda, atividade do período à direita. */
export function SirReportKpis({ summary, filters }: SirReportKpisProps) {
  if (summary.scopes.length === 0) return null;

  return (
    <section className="report-kpi-board" aria-label="Resumo por tipo">
      <div className="report-kpi-board__grid">
        {summary.scopes.map((scope) => (
          <article
            key={scope.key}
            className={`report-kpi-card report-kpi-card--${scopeKeyClass(scope.key)}`}
          >
            <header className="report-kpi-card__head">
              <Link
                href={buildSirScopeListHref(filters, scope.key)}
                className="report-kpi-card__badge"
                title={`Abrir monitoramento ${scope.label}`}
              >
                {scope.label}
              </Link>
              <Link
                href={buildSirScopeListHref(filters, scope.key)}
                className="report-kpi-card__hero"
                title={`Abrir ${scope.label} ativos`}
              >
                <span className="report-kpi-card__hero-value">{scope.totalActive}</span>
                <span className="report-kpi-card__hero-label">ativos</span>
              </Link>
            </header>

            <div className="report-kpi-card__groups">
              <div className="report-kpi-card__group">
                <span className="report-kpi-card__group-label">Agora</span>
                <div className="report-kpi-card__metrics">
                  <MetricLink
                    href={buildSirScopeListHref(filters, scope.key, "pendente")}
                    title={`Abrir ${scope.label} pendentes`}
                    value={scope.pending}
                    label="Pendentes"
                  />
                  <MetricLink
                    href={buildSirScopeListHref(filters, scope.key, "em-tratativa")}
                    title={`Abrir ${scope.label} em tratativa`}
                    value={scope.inTreatment}
                    label="Em tratativa"
                  />
                </div>
              </div>

              <div className="report-kpi-card__group">
                <span className="report-kpi-card__group-label">Período</span>
                <div className="report-kpi-card__metrics">
                  <MetricStatic value={scope.openingsInPeriod} label="Aberturas" />
                  <MetricLink
                    href={buildSirConclusionsHref(filters, scope.key)}
                    title={`Ver concluídos de ${scope.label}`}
                    value={scope.conclusionsInPeriod}
                    label="Conclusões"
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type MetricProps = {
  value: number;
  label: string;
  href?: string;
  title?: string;
};

/** Métrica clicável do card de KPI. */
function MetricLink({ value, label, href, title }: MetricProps & { href: string }) {
  const isConclusions = href.includes("#sir-concluidos");
  return (
    <Link
      href={href}
      className="report-kpi-metric"
      title={title}
      scroll={!isConclusions}
      onClick={() => {
        if (isConclusions) {
          scrollToReportSectionWhenReady("sir-concluidos");
        }
      }}
    >
      <span className="report-kpi-metric__value">{value}</span>
      <span className="report-kpi-metric__label">{label}</span>
    </Link>
  );
}

/** Métrica sem link. */
function MetricStatic({ value, label }: MetricProps) {
  return (
    <div className="report-kpi-metric report-kpi-metric--static">
      <span className="report-kpi-metric__value">{value}</span>
      <span className="report-kpi-metric__label">{label}</span>
    </div>
  );
}

/** Classe CSS estável a partir da chave do escopo. */
function scopeKeyClass(key: SirReportKpiScopeKey): string {
  return key.toLowerCase();
}
