"use client";

import Link from "next/link";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type {
  TratativaReportBacklog,
  TratativaReportFilters,
  TratativaReportSummary,
} from "@/lib/models/tratativa-report";
import { scrollToReportSection } from "@/lib/relatorios/scroll-to-section";

type TratativaReportKpisProps = {
  backlog: TratativaReportBacklog;
  summary: TratativaReportSummary;
  filters: TratativaReportFilters;
};

/** Resumo BSOD: backlog atual e atividade do período. */
export function TratativaReportKpis({ backlog, summary }: TratativaReportKpisProps) {
  return (
    <section className="report-kpi-board" aria-label="Resumo BSOD">
      <article className="report-kpi-strip report-kpi-strip--sdh">
        <div className="report-kpi-strip__hero">
          <Link href="/bsod" className="report-kpi-card__badge" title="Abrir monitoramento BSOD">
            BSOD
          </Link>
          <Link href="/bsod" className="report-kpi-card__hero" title="Abrir alarmes offline">
            <span className="report-kpi-card__hero-value">{backlog.totalOffline}</span>
            <span className="report-kpi-card__hero-label">offline</span>
          </Link>
        </div>

        <div className="report-kpi-strip__group">
          <span className="report-kpi-card__group-label">Agora</span>
          <div className="report-kpi-strip__metrics">
            <Link
              href="/bsod?status=pendente"
              className="report-kpi-metric"
              title="Abrir pendentes"
            >
              <span className="report-kpi-metric__value">{backlog.pending}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.bsodKpiPending}</span>
            </Link>
            <Link
              href="/bsod?status=em-tratativa"
              className="report-kpi-metric"
              title="Abrir em tratativa"
            >
              <span className="report-kpi-metric__value">{backlog.inProgress}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.bsodKpiInProgress}</span>
            </Link>
            <div className="report-kpi-metric report-kpi-metric--static">
              <span className="report-kpi-metric__value">{backlog.awaitingConclude}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.bsodKpiAwaiting}</span>
            </div>
          </div>
        </div>

        <div className="report-kpi-strip__divider" aria-hidden="true" />

        <div className="report-kpi-strip__group">
          <span className="report-kpi-card__group-label">Período</span>
          <div className="report-kpi-strip__metrics">
            <div className="report-kpi-metric report-kpi-metric--static">
              <span className="report-kpi-metric__value">{summary.assuncoes}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.bsodKpiStarts}</span>
            </div>
            <div className="report-kpi-metric report-kpi-metric--static">
              <span className="report-kpi-metric__value">{summary.acionamentos}</span>
              <span className="report-kpi-metric__label">
                {RELATORIOS_COPY.bsodKpiAcionamentos}
              </span>
            </div>
            <button
              type="button"
              className="report-kpi-metric"
              title="Ver encerramentos do período"
              onClick={() => scrollToReportSection("bsod-concluidos")}
            >
              <span className="report-kpi-metric__value">{summary.concluidas}</span>
              <span className="report-kpi-metric__label">{RELATORIOS_COPY.bsodKpiCloses}</span>
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
