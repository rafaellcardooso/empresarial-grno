import { RelatorioInsightKpi } from "@/components/relatorios/RelatorioInsightKpi";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { SirReportSummary } from "@/lib/models/sir-report";

type SirReportKpisProps = {
  summary: SirReportSummary;
  showRal: boolean;
  showRec: boolean;
};

/** Grade de KPIs por domínio RAL/REC. */
export function SirReportKpis({ summary, showRal, showRec }: SirReportKpisProps) {
  return (
    <div className="row g-3 relatorio-dashboard__kpis">
      {showRal ? (
        <>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-exclamation-octagon"
              label={RELATORIOS_COPY.sirKpiRalTotal}
              value={summary.ral.totalActive}
              tone="primary"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-hourglass-split"
              label={RELATORIOS_COPY.sirKpiRalPending}
              value={summary.ral.pending}
              tone="warning"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-tools"
              label={RELATORIOS_COPY.sirKpiRalTreatment}
              value={summary.ral.inTreatment}
              tone="success"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-calendar-plus"
              label={RELATORIOS_COPY.sirKpiRalOpenings}
              value={summary.ral.openingsInPeriod}
              tone="info"
            />
          </div>
        </>
      ) : null}
      {showRec ? (
        <>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-hdd-rack"
              label={RELATORIOS_COPY.sirKpiRecTotal}
              value={summary.rec.totalActive}
              tone="primary"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-hourglass"
              label={RELATORIOS_COPY.sirKpiRecPending}
              value={summary.rec.pending}
              tone="warning"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-wrench"
              label={RELATORIOS_COPY.sirKpiRecTreatment}
              value={summary.rec.inTreatment}
              tone="success"
            />
          </div>
          <div className="col-6 col-xl-3">
            <RelatorioInsightKpi
              icon="bi-calendar-event"
              label={RELATORIOS_COPY.sirKpiRecOpenings}
              value={summary.rec.openingsInPeriod}
              tone="info"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
