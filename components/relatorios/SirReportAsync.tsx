import { SirReportPanel } from "@/components/relatorios/SirReportPanel";
import type { SirReportFilters } from "@/lib/models/sir-report";
import { getSirReport } from "@/lib/queries/sir-reports";

type SirReportAsyncProps = {
  filters: SirReportFilters;
};

/** Carrega agregações do relatório SIR no servidor. */
export async function SirReportAsync({ filters }: SirReportAsyncProps) {
  const data = await getSirReport(filters);
  return <SirReportPanel filters={filters} data={data} />;
}
