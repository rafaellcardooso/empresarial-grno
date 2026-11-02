import { ReportHashScroll } from "@/components/relatorios/ReportHashScroll";
import { SirConcludedChamadosPanel } from "@/components/relatorios/SirConcludedChamadosPanel";
import { SirReportPanel } from "@/components/relatorios/SirReportPanel";
import type { SirReportFilters, SirReportKpiScopeKey } from "@/lib/models/sir-report";
import { listSirConcludedChamados } from "@/lib/queries/sir-concluded-chamados";
import { getSirReport } from "@/lib/queries/sir-reports";

type SirReportAsyncProps = {
  filters: SirReportFilters;
  concluidosPage: number;
  concluidosEscopo?: SirReportKpiScopeKey;
};

/** Carrega agregações e listagem de concluídos do relatório SIR no servidor. */
export async function SirReportAsync({
  filters,
  concluidosPage,
  concluidosEscopo,
}: SirReportAsyncProps) {
  const [data, concluded] = await Promise.all([
    getSirReport(filters),
    listSirConcludedChamados(filters, concluidosPage, undefined, concluidosEscopo),
  ]);

  return (
    <>
      <ReportHashScroll />
      <SirReportPanel filters={filters} data={data} />
      <SirConcludedChamadosPanel
        filters={filters}
        rows={concluded.rows}
        total={concluded.total}
        page={concluded.page}
        pageSize={concluded.pageSize}
        escopo={concluidosEscopo}
      />
    </>
  );
}
