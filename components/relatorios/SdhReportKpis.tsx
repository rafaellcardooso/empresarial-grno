"use client";

import Link from "next/link";
import { buildSdhScopeListHref } from "@/lib/config/sdh-report-drilldown";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { SdhReportFilters, SdhReportSummary } from "@/lib/models/sdh-report";
import { scrollToReportSection } from "@/lib/relatorios/scroll-to-section";

type SdhReportKpisProps = {
  summary: SdhReportSummary;
  filters: SdhReportFilters;
};

/** Resumo SDH em faixa: backlog atual e atividade do período. */
export function SdhReportKpis({ summary, filters }: SdhReportKpisProps) {
  return (
    <section className="report-kpi-board" aria-label="Resumo SDH">
      <article className="report-kpi-strip report-kpi-strip--sdh">
        <div className="report-kpi-strip__hero">
          <Link
            href={buildSdhScopeListHref(filters)}
            className="report-kpi-card__badge"
            title="Abrir monitoramento SDH"
          >
            SDH
          </Link>
          <Link
            href={buildSdhScopeListHref(filters)}
            className="report-kpi-card__hero"
            title="Abrir alarmes ativos"
          >
            <span className="report-kpi-card__hero-value">{summary.totalActive}</span>
            <span className="report-kpi-card__hero-label">ativos</span>
          </Link>
        </div>

        <div className="report-kpi-strip__group">
          <span className="report-kpi-card__group-label">Agora</span>
          <div className="report-kpi-strip__metrics">
            <Link
              href={buildSdhScopeListHref(filters, "pendente")}
              className="report-kpi-metric"
              title="Abrir alarmes pendentes"
            >
              <span className="report-kpi-metric__value">{summary.pending}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.sdhKpiPending}</span>
            </Link>
            <Link
              href={buildSdhScopeListHref(filters, "em-tratativa")}
              className="report-kpi-metric"
              title="Abrir alarmes em tratativa"
            >
              <span className="report-kpi-metric__value">{summary.inProgress}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.sdhKpiInProgress}</span>
            </Link>
            <div className="report-kpi-metric report-kpi-metric--static">
              <span className="report-kpi-metric__value">{summary.neverTouched}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.sdhKpiNeverTouched}</span>
            </div>
          </div>
        </div>

        <div className="report-kpi-strip__divider" aria-hidden="true" />

        <div className="report-kpi-strip__group">
          <span className="report-kpi-card__group-label">Período</span>
          <div className="report-kpi-strip__metrics">
            <div className="report-kpi-metric report-kpi-metric--static">
              <span className="report-kpi-metric__value">{summary.startsInPeriod}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.sdhKpiStarts}</span>
            </div>
            <button
              type="button"
              className="report-kpi-metric"
              title="Ver encerramentos do período"
              onClick={() => scrollToReportSection("sdh-concluidos")}
            >
              <span className="report-kpi-metric__value">{summary.closesInPeriod}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.sdhKpiCloses}</span>
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
