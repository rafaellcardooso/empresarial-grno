import { TratativaReportPanel } from "@/components/relatorios/TratativaReportPanel";
import { getSession } from "@/lib/auth/session";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";
import { getTratativaReport } from "@/lib/queries/tratativa-reports";

type TratativaReportAsyncProps = {
  filters: TratativaReportFilters;
};

/** Carrega dados analíticos de tratativas no servidor (segmento assíncrono). */
export async function TratativaReportAsync({ filters }: TratativaReportAsyncProps) {
  const session = await getSession();
  const isStaff = session?.role === "STAFF";
  const report = await getTratativaReport(filters, { includeOperators: isStaff });

  return <TratativaReportPanel filters={filters} data={report} showOperatorsRanking={isStaff} />;
}
