import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioShareBars } from "@/components/relatorios/RelatorioShareBars";
import { RelatorioTimelineChart } from "@/components/relatorios/RelatorioTimelineChart";
import { SdhReportActions } from "@/components/relatorios/SdhReportActions";
import { SdhReportBreakdownSection } from "@/components/relatorios/SdhReportBreakdownSection";
import { SdhReportKpis } from "@/components/relatorios/SdhReportKpis";
import { SdhReportSectionNav } from "@/components/relatorios/SdhReportSectionNav";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import { buildSdhMonitorHref, buildSdhReportExportHref } from "@/lib/config/sdh-report-filters";
import type { SdhReportData, SdhReportFilters } from "@/lib/models/sdh-report";

type SdhReportPanelProps = {
  filters: SdhReportFilters;
  data: SdhReportData;
};

/** Formata YYYY-MM-DD para rótulo curto do eixo diário. */
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Painel analítico do backlog SDH ativo e atividade de tratativa. */
export function SdhReportPanel({ filters, data }: SdhReportPanelProps) {
  const { summary, ageBuckets, byDdd, byVendor, byMunicipio, byAlarme, daily } = data;

  const hasBacklog = summary.totalActive > 0;
  const hasPeriodActivity =
    summary.startsInPeriod > 0 ||
    summary.observationsInPeriod > 0 ||
    summary.legacyUpdatesInPeriod > 0 ||
    summary.closesInPeriod > 0;
  const hasData = hasBacklog || hasPeriodActivity;
  const monitorHref = buildSdhMonitorHref(filters);
  const exportHref = buildSdhReportExportHref(filters);

  const agePoints = ageBuckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.total,
  }));

  const dailyStartPoints = daily.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.starts,
  }));

  const dailyClosePoints = daily.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.closes,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-sdh-title">
      <header className="relatorio-dashboard__header relatorio-dashboard__header--compact">
        <h2 className="relatorio-dashboard__title" id="relatorio-sdh-title">
          {RELATORIOS_COPY.sdhSectionTitle}
        </h2>
        <SdhReportActions
          monitorHref={monitorHref}
          exportHref={exportHref}
          periodLabel={relatorioPeriodLabel(filters.from, filters.to)}
        />
      </header>

      <SdhReportSectionNav />

      {!hasData ? (
        <p className="relatorio-dashboard__empty">{RELATORIOS_COPY.sdhEmpty}</p>
      ) : (
        <>
          <div id="sdh-resumo">
            <SdhReportKpis summary={summary} filters={filters} />
          </div>

          <div
            id="sdh-graficos"
            className="relatorio-dashboard__grid relatorio-dashboard__grid--series"
          >
            <RelatorioChartCard
              title={RELATORIOS_COPY.sdhAgeTitle}
              lead={RELATORIOS_COPY.sdhAgeLead}
              icon="bi-clock-history"
            >
              <RelatorioShareBars items={agePoints} empty={RELATORIOS_COPY.sdhEmpty} />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.sdhDailyTitle}
              lead={RELATORIOS_COPY.sdhDailyLead}
              icon="bi-bar-chart-line"
            >
              <RelatorioTimelineChart
                points={dailyStartPoints}
                empty={RELATORIOS_COPY.sdhEmptyDaily}
              />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.sdhDailyConclusionsTitle}
              lead={RELATORIOS_COPY.sdhDailyConclusionsLead}
              icon="bi-check2-square"
            >
              <RelatorioTimelineChart
                points={dailyClosePoints}
                empty={RELATORIOS_COPY.sdhEmptyDailyConclusions}
              />
            </RelatorioChartCard>
          </div>

          <SdhReportBreakdownSection
            filters={filters}
            byDdd={byDdd}
            byVendor={byVendor}
            byMunicipio={byMunicipio}
            byAlarme={byAlarme}
          />
        </>
      )}
    </section>
  );
}
