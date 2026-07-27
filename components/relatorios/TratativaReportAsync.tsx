import { TratativaChamadosPanel } from "@/components/relatorios/TratativaChamadosPanel";
import { TratativaReportPanel } from "@/components/relatorios/TratativaReportPanel";
import { getSession } from "@/lib/auth/session";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";
import { listTratativaChamados } from "@/lib/queries/tratativa-chamados";
import { getTratativaReport } from "@/lib/queries/tratativa-reports";

type TratativaReportAsyncProps = {
  filters: TratativaReportFilters;
};

/** Carrega dados analíticos e listagem de chamados no servidor. */
export async function TratativaReportAsync({ filters }: TratativaReportAsyncProps) {
  const session = await getSession();
  const isStaff = session?.role === "STAFF";

  const [report, chamados] = await Promise.all([
    getTratativaReport(filters, { includeOperators: isStaff }),
    listTratativaChamados({
      from: filters.from,
      to: filters.to,
      status: filters.status ?? "all",
    }),
  ]);

  return (
    <>
      <TratativaChamadosPanel filters={filters} rows={chamados.rows} counts={chamados.counts} />
      <TratativaReportPanel filters={filters} data={report} showOperatorsRanking={isStaff} />
    </>
  );
}
