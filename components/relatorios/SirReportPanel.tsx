import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioShareBars } from "@/components/relatorios/RelatorioShareBars";
import { RelatorioTimelineChart } from "@/components/relatorios/RelatorioTimelineChart";
import { SirReportActions } from "@/components/relatorios/SirReportActions";
import { SirReportBreakdownSection } from "@/components/relatorios/SirReportBreakdownSection";
import { SirReportKpis } from "@/components/relatorios/SirReportKpis";
import { SirReportSectionNav } from "@/components/relatorios/SirReportSectionNav";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import { buildSirMonitorHref, buildSirReportExportHref } from "@/lib/config/sir-report-filters";
import type { SirReportData, SirReportFilters } from "@/lib/models/sir-report";

type SirReportPanelProps = {
  filters: SirReportFilters;
  data: SirReportData;
};

/** Formata YYYY-MM-DD para rótulo curto do eixo diário. */
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Painel analítico do backlog SIR, aberturas e conclusões no período. */
export function SirReportPanel({ filters, data }: SirReportPanelProps) {
  const { summary, ageBuckets, byCf, byTipo, byDdd, dailyOpenings, dailyConclusions } = data;
  const showRal = filters.domain === "all" || filters.domain === "ral";
  const showRec = filters.domain === "all" || filters.domain === "rec";
  const showDomain = filters.domain === "all";
  const hasBacklog =
    (showRal && summary.ral.totalActive > 0) || (showRec && summary.rec.totalActive > 0);
  const hasPeriodActivity =
    (showRal && (summary.ral.openingsInPeriod > 0 || summary.ral.conclusionsInPeriod > 0)) ||
    (showRec && (summary.rec.openingsInPeriod > 0 || summary.rec.conclusionsInPeriod > 0));
  const hasData = hasBacklog || hasPeriodActivity;
  const monitorHref = buildSirMonitorHref(filters);
  const exportHref = buildSirReportExportHref(filters);

  const agePoints = ageBuckets
    .filter((bucket) => (bucket.domain === "RAL" ? showRal : showRec))
    .map((bucket) => ({
      label: showDomain ? `${bucket.domain} · ${bucket.label}` : bucket.label,
      value: bucket.total,
    }));

  const dailyPoints = dailyOpenings.map((point) => ({
    label: formatDayLabel(point.date),
    value: showDomain ? point.total : showRal ? point.ral : point.rec,
  }));

  const dailyConclusionPoints = dailyConclusions.map((point) => ({
    label: formatDayLabel(point.date),
    value: showDomain ? point.total : showRal ? point.ral : point.rec,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-sir-title">
      <header className="relatorio-dashboard__header relatorio-dashboard__header--compact">
        <h2 className="relatorio-dashboard__title" id="relatorio-sir-title">
          {RELATORIOS_COPY.sirSectionTitle}
        </h2>
        <SirReportActions
          monitorHref={monitorHref}
          exportHref={exportHref}
          periodLabel={relatorioPeriodLabel(filters.from, filters.to)}
        />
      </header>

      <SirReportSectionNav />

      {!hasData ? (
        <p className="relatorio-dashboard__empty">{RELATORIOS_COPY.sirEmpty}</p>
      ) : (
        <>
          <div id="sir-resumo">
            <SirReportKpis summary={summary} filters={filters} />
          </div>

          <div
            id="sir-graficos"
            className="relatorio-dashboard__grid relatorio-dashboard__grid--series"
          >
            <RelatorioChartCard
              title={RELATORIOS_COPY.sirAgeTitle}
              lead={RELATORIOS_COPY.sirAgeLead}
              icon="bi-clock-history"
            >
              <RelatorioShareBars items={agePoints} empty={RELATORIOS_COPY.sirEmpty} />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.sirDailyTitle}
              lead={RELATORIOS_COPY.sirDailyLead}
              icon="bi-bar-chart-line"
            >
              <RelatorioTimelineChart points={dailyPoints} empty={RELATORIOS_COPY.sirEmptyDaily} />
            </RelatorioChartCard>
            <RelatorioChartCard
              title={RELATORIOS_COPY.sirDailyConclusionsTitle}
              lead={RELATORIOS_COPY.sirDailyConclusionsLead}
              icon="bi-check2-square"
            >
              <RelatorioTimelineChart
                points={dailyConclusionPoints}
                empty={RELATORIOS_COPY.sirEmptyDailyConclusions}
              />
            </RelatorioChartCard>
          </div>

          <SirReportBreakdownSection
            filters={filters}
            byDdd={byDdd}
            byTipo={byTipo}
            byCf={byCf}
            showDomain={showDomain}
          />
        </>
      )}
    </section>
  );
}
