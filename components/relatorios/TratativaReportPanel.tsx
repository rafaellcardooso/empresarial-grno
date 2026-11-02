import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioFunnelChart } from "@/components/relatorios/RelatorioFunnelChart";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import { RelatorioShareBars } from "@/components/relatorios/RelatorioShareBars";
import { RelatorioTimelineChart } from "@/components/relatorios/RelatorioTimelineChart";
import { TratativaReportKpis } from "@/components/relatorios/TratativaReportKpis";
import { TratativaReportSectionNav } from "@/components/relatorios/TratativaReportSectionNav";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import type { TratativaReportData, TratativaReportFilters } from "@/lib/models/tratativa-report";
import { buildTratativaFunnelSteps } from "@/lib/relatorios/tratativa-insights";
import Link from "next/link";

type TratativaReportPanelProps = {
  filters: TratativaReportFilters;
  data: TratativaReportData;
};

/** Formata YYYY-MM-DD para rótulo curto do eixo diário. */
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Painel analítico BSOD no formato dos relatórios SIR/SDH. */
export function TratativaReportPanel({ filters, data }: TratativaReportPanelProps) {
  const { backlog, summary, dailyStarts, dailyConclusions, bySymptom, topClients } = data;
  const hasBacklog = backlog.totalOffline > 0 || backlog.awaitingConclude > 0;
  const hasPeriodActivity =
    summary.assuncoes > 0 || summary.acionamentos > 0 || summary.concluidas > 0;
  const hasData = hasBacklog || hasPeriodActivity;
  const funnelSteps = buildTratativaFunnelSteps(data);

  const dailyStartPoints = dailyStarts.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.total,
  }));
  const dailyClosePoints = dailyConclusions.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.total,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-tratativas-title">
      <header className="relatorio-dashboard__header relatorio-dashboard__header--compact">
        <h2 className="relatorio-dashboard__title" id="relatorio-tratativas-title">
          {RELATORIOS_COPY.tratativasSectionTitle}
        </h2>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="relatorio-dashboard__period-badge">
            {relatorioPeriodLabel(filters.from, filters.to)}
          </span>
          <Link href="/bsod" className="btn btn-outline-primary btn-sm">
            {RELATORIOS_COPY.bsodOpenMonitor}
          </Link>
        </div>
      </header>

      <TratativaReportSectionNav />

      {!hasData ? (
        <p className="relatorio-dashboard__empty">{RELATORIOS_COPY.emptyTratativas}</p>
      ) : (
        <>
          <div id="bsod-resumo">
            <TratativaReportKpis backlog={backlog} summary={summary} filters={filters} />
          </div>

          <div
            id="bsod-graficos"
            className="relatorio-dashboard__grid relatorio-dashboard__grid--series"
          >
            <RelatorioChartCard
              title={RELATORIOS_COPY.bsodFunnelTitle}
              lead={RELATORIOS_COPY.bsodFunnelLead}
              icon="bi-funnel"
            >
              <RelatorioFunnelChart steps={funnelSteps} empty={RELATORIOS_COPY.emptyTratativas} />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.bsodDailyTitle}
              lead={RELATORIOS_COPY.bsodDailyLead}
              icon="bi-bar-chart-line"
            >
              <RelatorioTimelineChart
                points={dailyStartPoints}
                empty={RELATORIOS_COPY.bsodEmptyDaily}
              />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.bsodDailyConclusionsTitle}
              lead={RELATORIOS_COPY.bsodDailyConclusionsLead}
              icon="bi-check2-square"
            >
              <RelatorioTimelineChart
                points={dailyClosePoints}
                empty={RELATORIOS_COPY.bsodEmptyDailyConclusions}
              />
            </RelatorioChartCard>
          </div>

          <div className="relatorio-dashboard__grid relatorio-dashboard__grid--pair">
            <RelatorioChartCard
              title={RELATORIOS_COPY.symptomsTitle}
              lead={RELATORIOS_COPY.symptomsLead}
              icon="bi-clipboard2-pulse"
            >
              <RelatorioShareBars
                items={bySymptom.map((row) => ({ label: row.label, value: row.total }))}
                empty={RELATORIOS_COPY.emptySymptoms}
              />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.topClientsTitle}
              lead={RELATORIOS_COPY.topClientsLead}
              icon="bi-building"
            >
              <RelatorioRankedBarChart
                items={topClients.map((row) => ({
                  label: row.label,
                  value: row.total,
                  hint: row.hint,
                }))}
                empty={RELATORIOS_COPY.emptyTopClients}
              />
            </RelatorioChartCard>
          </div>
        </>
      )}
    </section>
  );
}
