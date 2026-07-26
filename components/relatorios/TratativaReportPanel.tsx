import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioColumnChart } from "@/components/relatorios/RelatorioColumnChart";
import { RelatorioDonutChart } from "@/components/relatorios/RelatorioDonutChart";
import { RelatorioFunnelChart } from "@/components/relatorios/RelatorioFunnelChart";
import { RelatorioInsightKpi } from "@/components/relatorios/RelatorioInsightKpi";
import { RelatorioInsightsStrip } from "@/components/relatorios/RelatorioInsightsStrip";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import { ContentCard } from "@/components/ui/ContentCard";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { relatorioPeriodLabel } from "@/lib/config/relatorios-filters";
import type { TratativaReportData, TratativaReportFilters } from "@/lib/models/tratativa-report";
import {
  buildTratativaFunnelSteps,
  buildTratativaInsightHighlights,
} from "@/lib/relatorios/tratativa-insights";

type TratativaReportPanelProps = {
  filters: TratativaReportFilters;
  data: TratativaReportData;
  showOperatorsRanking?: boolean;
};

/** Painel analítico de tratativas com dashboard visual. */
export function TratativaReportPanel({
  filters,
  data,
  showOperatorsRanking = false,
}: TratativaReportPanelProps) {
  const { summary, daily, byEvent, operators, bySymptom, topClients } = data;
  const hasData =
    summary.assuncoes +
      summary.acionamentos +
      summary.validacoes +
      summary.concluidas +
      summary.liberacoes >
    0;

  const insights = buildTratativaInsightHighlights(data);
  const funnelSteps = buildTratativaFunnelSteps(data);

  const dailyPoints = daily.map((point) => ({
    label: formatDayLabel(point.date),
    value: point.total,
  }));

  const eventTone = (key: string): "default" | "success" | "danger" | "warning" | "info" => {
    if (key === "START") return "info";
    if (key === "ACIONAMENTO") return "warning";
    if (key === "VALIDACAO_APROVADA" || key === "CONCLUIDA") return "success";
    if (key === "VALIDACAO_REPROVADA") return "danger";
    if (key === "VALIDACAO_SOLICITADA") return "default";
    return "default";
  };

  const operatorItems = operators.map((row) => ({
    label: `${row.userName} · ${row.userCorporateId}`,
    value: row.acionamentos,
    hint:
      row.concluidas > 0
        ? `${row.concluidas} ${RELATORIOS_COPY.operatorConcluidas.toLowerCase()}`
        : undefined,
    tone: "default" as const,
  }));

  return (
    <section className="relatorio-dashboard" aria-labelledby="relatorio-tratativas-title">
      <header className="relatorio-dashboard__header">
        <div>
          <h2 className="h5 mb-1" id="relatorio-tratativas-title">
            {RELATORIOS_COPY.tratativasSectionTitle}
          </h2>
          <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.tratativasSectionLead}</p>
        </div>
        <span className="relatorio-dashboard__period-badge">
          {relatorioPeriodLabel(filters.from, filters.to)}
        </span>
      </header>

      {!hasData ? (
        <ContentCard title="Tratativas" bodyClassName="p-3">
          <p className="text-body-secondary mb-0">{RELATORIOS_COPY.emptyTratativas}</p>
        </ContentCard>
      ) : (
        <>
          <RelatorioInsightsStrip items={insights} />

          <div className="row g-3 relatorio-dashboard__kpis">
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-person-check"
                label={RELATORIOS_COPY.kpiAssuncoes}
                value={summary.assuncoes}
                hint={RELATORIOS_COPY.kpiAssuncoesHint}
                tone="info"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-send-check"
                label={RELATORIOS_COPY.kpiAcionamentos}
                value={summary.acionamentos}
                hint={RELATORIOS_COPY.kpiAcionamentosHint}
                tone="warning"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-clipboard2-check"
                label={RELATORIOS_COPY.kpiValidacoes}
                value={summary.validacoes}
                hint={`${summary.validacoesAprovadas} ${RELATORIOS_COPY.kpiAprovadas.toLowerCase()} · ${summary.validacoesReprovadas} ${RELATORIOS_COPY.kpiReprovadas.toLowerCase()}`}
                tone="primary"
              />
            </div>
            <div className="col-6 col-xl-3">
              <RelatorioInsightKpi
                icon="bi-flag-fill"
                label={RELATORIOS_COPY.kpiConcluidas}
                value={summary.concluidas}
                hint={
                  summary.duracaoMediaMinutos != null
                    ? RELATORIOS_COPY.durationHint(summary.duracaoMediaMinutos)
                    : RELATORIOS_COPY.durationUnavailable
                }
                tone="success"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-8">
              <RelatorioChartCard
                title={RELATORIOS_COPY.dailyChartTitle}
                lead={RELATORIOS_COPY.dailyChartLead}
                icon="bi-bar-chart-line"
              >
                <RelatorioColumnChart points={dailyPoints} empty={RELATORIOS_COPY.emptyDaily} />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-4">
              <RelatorioChartCard
                title={RELATORIOS_COPY.funnelTitle}
                lead={RELATORIOS_COPY.funnelLead}
                icon="bi-funnel"
              >
                <RelatorioFunnelChart steps={funnelSteps} empty={RELATORIOS_COPY.emptyTratativas} />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-5">
              <RelatorioChartCard
                title={RELATORIOS_COPY.eventMixTitle}
                lead={RELATORIOS_COPY.eventMixLead}
                icon="bi-pie-chart"
              >
                <RelatorioDonutChart
                  slices={byEvent.map((item) => ({
                    label: item.label,
                    value: item.total,
                    tone: eventTone(item.key),
                  }))}
                  centerLabel="Eventos"
                  empty={RELATORIOS_COPY.emptyTratativas}
                />
              </RelatorioChartCard>
            </div>
            <div className="col-lg-7">
              <RelatorioChartCard
                title={RELATORIOS_COPY.symptomsTitle}
                lead={RELATORIOS_COPY.symptomsLead}
                icon="bi-activity"
              >
                <RelatorioDonutChart
                  slices={bySymptom.map((row) => ({
                    label: row.label,
                    value: row.total,
                    tone: "warning" as const,
                  }))}
                  centerLabel="VTs"
                  empty={RELATORIOS_COPY.emptySymptoms}
                />
              </RelatorioChartCard>
            </div>
          </div>

          <div className="row g-3">
            <div className={showOperatorsRanking ? "col-lg-6" : "col-12"}>
              <RelatorioChartCard
                title={RELATORIOS_COPY.topClientsTitle}
                lead={RELATORIOS_COPY.topClientsLead}
                icon="bi-building"
              >
                <RelatorioRankedBarChart
                  items={clientItemsFrom(topClients)}
                  empty={RELATORIOS_COPY.emptyTopClients}
                />
              </RelatorioChartCard>
            </div>
            {showOperatorsRanking ? (
              <div className="col-lg-6">
                <RelatorioChartCard
                  title={RELATORIOS_COPY.operatorsTitle}
                  lead={RELATORIOS_COPY.operatorsLead}
                  icon="bi-people"
                >
                  <RelatorioRankedBarChart
                    items={operatorItems}
                    empty={RELATORIOS_COPY.emptyOperators}
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

function clientItemsFrom(
  rows: TratativaReportData["topClients"],
): Array<{ label: string; value: number; hint?: string; tone: "danger" }> {
  return rows.map((row) => ({
    label: row.label,
    value: row.total,
    hint: row.hint,
    tone: "danger" as const,
  }));
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}
