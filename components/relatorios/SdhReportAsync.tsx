import { ReportHashScroll } from "@/components/relatorios/ReportHashScroll";
import { SdhConcludedChamadosPanel } from "@/components/relatorios/SdhConcludedChamadosPanel";
import { SdhReportPanel } from "@/components/relatorios/SdhReportPanel";
import type { SdhReportFilters } from "@/lib/models/sdh-report";
import { listSdhConcludedChamados } from "@/lib/queries/sdh-concluded-chamados";
import { getSdhReport } from "@/lib/queries/sdh-reports";

type SdhReportAsyncProps = {
  filters: SdhReportFilters;
  concluidosPage: number;
};

/** Carrega agregações e listagem de encerramentos do relatório SDH no servidor. */
export async function SdhReportAsync({ filters, concluidosPage }: SdhReportAsyncProps) {
  const [data, concluded] = await Promise.all([
    getSdhReport(filters),
    listSdhConcludedChamados(filters, concluidosPage),
  ]);

  return (
    <>
      <ReportHashScroll />
      <SdhReportPanel filters={filters} data={data} />
      <SdhConcludedChamadosPanel
        filters={filters}
        rows={concluded.rows}
        total={concluded.total}
        page={concluded.page}
        pageSize={concluded.pageSize}
      />
    </>
  );
}
