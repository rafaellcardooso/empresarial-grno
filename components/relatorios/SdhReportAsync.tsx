import { SdhReportPanel } from "@/components/relatorios/SdhReportPanel";
import { getSession } from "@/lib/auth/session";
import type { SdhReportFilters } from "@/lib/models/sdh-report";
import { getSdhReport } from "@/lib/queries/sdh-reports";

type SdhReportAsyncProps = {
  filters: SdhReportFilters;
};

/** Carrega agregações do relatório SDH no servidor. */
export async function SdhReportAsync({ filters }: SdhReportAsyncProps) {
  const session = await getSession();
  const showOperatorsRanking = session?.role === "STAFF";
  const data = await getSdhReport(filters, { includeOperators: showOperatorsRanking });

  return (
    <SdhReportPanel filters={filters} data={data} showOperatorsRanking={showOperatorsRanking} />
  );
}
