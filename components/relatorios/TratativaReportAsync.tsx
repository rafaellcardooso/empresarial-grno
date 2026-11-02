import { BsodConcludedChamadosPanel } from "@/components/relatorios/BsodConcludedChamadosPanel";
import { ReportHashScroll } from "@/components/relatorios/ReportHashScroll";
import { TratativaReportPanel } from "@/components/relatorios/TratativaReportPanel";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";
import { listBsodConcludedChamados } from "@/lib/queries/bsod-concluded-chamados";
import { getTratativaReport } from "@/lib/queries/tratativa-reports";

type TratativaReportAsyncProps = {
  filters: TratativaReportFilters;
};

/** Carrega agregações e listagem de encerramentos do relatório BSOD no servidor. */
export async function TratativaReportAsync({ filters }: TratativaReportAsyncProps) {
  const [report, concluded] = await Promise.all([
    getTratativaReport(filters),
    listBsodConcludedChamados({ from: filters.from, to: filters.to }, filters.page ?? 1),
  ]);

  return (
    <>
      <ReportHashScroll />
      <TratativaReportPanel filters={filters} data={report} />
      <BsodConcludedChamadosPanel
        filters={filters}
        rows={concluded.rows}
        total={concluded.total}
        page={concluded.page}
        pageSize={concluded.pageSize}
      />
    </>
  );
}
