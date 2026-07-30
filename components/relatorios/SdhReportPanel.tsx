import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioColumnChart } from "@/components/relatorios/RelatorioColumnChart";
import { RelatorioDonutChart } from "@/components/relatorios/RelatorioDonutChart";
import { RelatorioInsightKpi } from "@/components/relatorios/RelatorioInsightKpi";
import { RelatorioInsightsStrip } from "@/components/relatorios/RelatorioInsightsStrip";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import { SdhReportActions } from "@/components/relatorios/SdhReportActions";
import { ContentCard } from "@/components/ui/ContentCard";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import { buildSdhMonitorHref, buildSdhReportExportHref } from "@/lib/config/sdh-report-filters";
import type { SdhReportData, SdhReportFilters } from "@/lib/models/sdh-report";
import { buildSdhInsightHighlights } from "@/lib/relatorios/sdh-insights";

type SdhReportPanelProps = {
  filters: SdhReportFilters;
  data: SdhReportData;
  showOperatorsRanking?: boolean;
};

/** Formata YYYY-MM-DD para rótulo curto do eixo diário. */
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Painel analítico do backlog SDH ativo e atividade de tratativa. */
export function SdhReportPanel({
  filters,
  data,
  showOperatorsRanking = false,
}: SdhReportPanelProps) {
  const {
    summary,
    statusSlices,
    ageBuckets,
    byDdd,
    byVendor,
    byMunicipio,
    byAlarme,
    daily,
    operators,
  } = data;

  const hasBacklog = summary.totalActive > 0;
  const insights = buildSdhInsightHighlights(data, { includeOperators: showOperatorsRanking });
  const monitorHref = buildSdhMonitorHref(filters);
  const exportHref = buildSdhReportExportHref(filters);

  const dailyPoints = daily.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.total,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-sdh-title">
      <header className="relatorio-dashboard__header">
        <div>
          <h2 className="h5 mb-1" id="relatorio-sdh-title">
            {RELATORIOS_COPY.sdhSectionTitle}
          </h2>
          <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.sdhSectionLead}</p>
        </div>
        <SdhReportActions
          monitorHref={monitorHref}
          exportHref={exportHref}
          periodLabel={relatorioPeriodLabel(filters.from, filters.to)}
        />
      </header>

      {!hasBacklog ? (
        <ContentCard title="SDH" bodyClassName="p-3">
          <p className="text-body-secondary mb-0">{RELATORIOS_COPY.sdhEmpty}</p>
        </ContentCard>
      ) : (
        <>
          <RelatorioInsightsStrip items={insights} />

          <div className="row g-3 relatorio-dashboard__kpis">
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-broadcast"
                label={RELATORIOS_COPY.sdhKpiTotal}
                value={summary.totalActive}
                tone="primary"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-hourglass-split"
                label={RELATORIOS_COPY.sdhKpiPending}
                value={summary.pending}
                tone="warning"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-tools"
                label={RELATORIOS_COPY.sdhKpiInProgress}
                value={summary.inProgress}
                tone="success"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-exclamation-circle"
                label={RELATORIOS_COPY.sdhKpiNeverTouched}
                value={summary.neverTouched}
                tone="warning"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-person-check"
                label={RELATORIOS_COPY.sdhKpiStarts}
                value={summary.startsInPeriod}
                hint={`${summary.alarmsTouchedInPeriod} alarmes no período`}
                tone="info"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-chat-left-text"
                label={RELATORIOS_COPY.sdhKpiObservations}
                value={summary.observationsInPeriod}
                tone="info"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-clock-history"
                label={RELATORIOS_COPY.sdhKpiLegacyUpdates}
                value={summary.legacyUpdatesInPeriod}
                tone="info"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-check2-circle"
                label={RELATORIOS_COPY.sdhKpiCloses}
                value={summary.closesInPeriod}
                tone="success"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-4">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhStatusTitle}
                lead={RELATORIOS_COPY.sdhStatusLead}
                icon="bi-pie-chart"
              >
                <RelatorioDonutChart
                  slices={statusSlices.map((slice) => ({
                    label: slice.label,
                    value: slice.total,
                    tone: slice.key === "in-progress" ? "success" : "warning",
                  }))}
                  centerLabel="Ativos"
                  empty={RELATORIOS_COPY.sdhEmpty}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-8">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhAgeTitle}
                lead={RELATORIOS_COPY.sdhAgeLead}
                icon="bi-clock-history"
              >
                <RelatorioColumnChart
                  points={ageBuckets.map((bucket) => ({
                    label: bucket.label,
                    value: bucket.total,
                  }))}
                  empty={RELATORIOS_COPY.sdhEmpty}
                />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhDddTitle}
                lead={RELATORIOS_COPY.sdhDddLead}
                icon="bi-geo-alt"
              >
                <RelatorioRankedBarChart
                  items={byDdd.map((row) => ({ label: row.label, value: row.total }))}
                  empty={RELATORIOS_COPY.sdhEmptyRank}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhVendorTitle}
                lead={RELATORIOS_COPY.sdhVendorLead}
                icon="bi-hdd-stack"
              >
                <RelatorioRankedBarChart
                  items={byVendor.map((row) => ({ label: row.label, value: row.total }))}
                  empty={RELATORIOS_COPY.sdhEmptyRank}
                />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhMunicipioTitle}
                lead={RELATORIOS_COPY.sdhMunicipioLead}
                icon="bi-building"
              >
                <RelatorioRankedBarChart
                  items={byMunicipio.map((row) => ({ label: row.label, value: row.total }))}
                  empty={RELATORIOS_COPY.sdhEmptyRank}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhAlarmeTitle}
                lead={RELATORIOS_COPY.sdhAlarmeLead}
                icon="bi-exclamation-octagon"
              >
                <RelatorioRankedBarChart
                  items={byAlarme.map((row) => ({ label: row.label, value: row.total }))}
                  empty={RELATORIOS_COPY.sdhEmptyRank}
                />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className={showOperatorsRanking ? "col-lg-8" : "col-12"}>
              <RelatorioChartCard
                title={RELATORIOS_COPY.sdhDailyTitle}
                lead={RELATORIOS_COPY.sdhDailyLead}
                icon="bi-bar-chart-line"
              >
                <RelatorioColumnChart points={dailyPoints} empty={RELATORIOS_COPY.sdhEmptyDaily} />
              </RelatorioChartCard>
            </div>
            {showOperatorsRanking ? (
              <div className="col-lg-4">
                <RelatorioChartCard
                  title={RELATORIOS_COPY.sdhOperatorsTitle}
                  lead={RELATORIOS_COPY.sdhOperatorsLead}
                  icon="bi-people"
                >
                  <RelatorioRankedBarChart
                    items={operators.map((row) => ({
                      label: row.userLogin,
                      value: row.total,
                      hint: `${row.starts} assumidos · ${row.observations} obs. · ${row.closes} encerramentos`,
                    }))}
                    empty={RELATORIOS_COPY.sdhEmptyOperators}
                  />
                </RelatorioChartCard>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
