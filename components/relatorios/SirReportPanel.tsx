import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioColumnChart } from "@/components/relatorios/RelatorioColumnChart";
import { RelatorioInsightsStrip } from "@/components/relatorios/RelatorioInsightsStrip";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import { SirReportActions } from "@/components/relatorios/SirReportActions";
import { SirReportKpis } from "@/components/relatorios/SirReportKpis";
import { ContentCard } from "@/components/ui/ContentCard";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import { buildSirMonitorHref, buildSirReportExportHref } from "@/lib/config/sir-report-filters";
import type { SirReportData, SirReportFilters, SirReportRankRow } from "@/lib/models/sir-report";
import { buildSirInsightHighlights } from "@/lib/relatorios/sir-insights";

type SirReportPanelProps = {
  filters: SirReportFilters;
  data: SirReportData;
};

/** Formata YYYY-MM-DD para rótulo curto do eixo diário. */
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Agrupa ranking com prefixo de domínio quando ambos estão visíveis. */
function rankItems(rows: SirReportRankRow[], showDomain: boolean) {
  return rows.map((row) => ({
    label: showDomain ? `${row.domain} · ${row.label}` : row.label,
    value: row.total,
  }));
}

/** Painel analítico do backlog SIR e aberturas no período. */
export function SirReportPanel({ filters, data }: SirReportPanelProps) {
  const { summary, ageBuckets, byCf, byTipo, byDdd, dailyOpenings } = data;
  const showRal = filters.domain === "all" || filters.domain === "ral";
  const showRec = filters.domain === "all" || filters.domain === "rec";
  const showDomain = filters.domain === "all";
  const hasBacklog =
    (showRal && summary.ral.totalActive > 0) || (showRec && summary.rec.totalActive > 0);
  const insights = buildSirInsightHighlights(data);
  const monitorHref = buildSirMonitorHref(filters);
  const exportHref = buildSirReportExportHref(filters);

  const agePoints = ageBuckets
    .filter((bucket) => (bucket.domain === "RAL" ? showRal : showRec))
    .map((bucket) => ({
      label: showDomain ? `${bucket.domain} ${bucket.label}` : bucket.label,
      value: bucket.total,
    }));

  const dailyPoints = dailyOpenings.map((point) => ({
    label: formatDayLabel(point.date),
    value: showDomain ? point.total : showRal ? point.ral : point.rec,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-sir-title">
      <header className="relatorio-dashboard__header">
        <div>
          <h2 className="h5 mb-1" id="relatorio-sir-title">
            {RELATORIOS_COPY.sirSectionTitle}
          </h2>
          <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.sirSectionLead}</p>
        </div>
        <SirReportActions
          monitorHref={monitorHref}
          exportHref={exportHref}
          periodLabel={relatorioPeriodLabel(filters.from, filters.to)}
        />
      </header>

      {!hasBacklog ? (
        <ContentCard title="SIR" bodyClassName="p-3">
          <p className="text-body-secondary mb-0">{RELATORIOS_COPY.sirEmpty}</p>
        </ContentCard>
      ) : (
        <>
          <RelatorioInsightsStrip items={insights} />
          <SirReportKpis summary={summary} showRal={showRal} showRec={showRec} />

          <div className="row g-3">
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sirAgeTitle}
                lead={RELATORIOS_COPY.sirAgeLead}
                icon="bi-clock-history"
              >
                <RelatorioColumnChart points={agePoints} empty={RELATORIOS_COPY.sirEmpty} />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-6">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sirDailyTitle}
                lead={RELATORIOS_COPY.sirDailyLead}
                icon="bi-bar-chart-line"
              >
                <RelatorioColumnChart points={dailyPoints} empty={RELATORIOS_COPY.sirEmptyDaily} />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-4">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sirDddTitle}
                lead={RELATORIOS_COPY.sirDddLead}
                icon="bi-geo-alt"
              >
                <RelatorioRankedBarChart
                  items={rankItems(byDdd, showDomain)}
                  empty={RELATORIOS_COPY.sirEmptyRank}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-4">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sirTipoTitle}
                lead={RELATORIOS_COPY.sirTipoLead}
                icon="bi-tags"
              >
                <RelatorioRankedBarChart
                  items={rankItems(byTipo, showDomain)}
                  empty={RELATORIOS_COPY.sirEmptyRank}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-4">
              <RelatorioChartCard
                title={RELATORIOS_COPY.sirCfTitle}
                lead={RELATORIOS_COPY.sirCfLead}
                icon="bi-building"
              >
                <RelatorioRankedBarChart
                  items={rankItems(byCf, showDomain)}
                  empty={RELATORIOS_COPY.sirEmptyRank}
                />
              </RelatorioChartCard>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
