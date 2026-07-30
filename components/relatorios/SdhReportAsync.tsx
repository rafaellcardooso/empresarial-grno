import { SdhReportPanel } from "@/components/relatorios/SdhReportPanel";
import type { SdhReportFilters } from "@/lib/models/sdh-report";
import { getSdhReport } from "@/lib/queries/sdh-reports";

type SdhReportAsyncProps = {
  filters: SdhReportFilters;
};

/** Carrega agregações do relatório SDH no servidor. */
export async function SdhReportAsync({ filters }: SdhReportAsyncProps) {
  const data = await getSdhReport(filters);
  return <SdhReportPanel filters={filters} data={data} />;
}
