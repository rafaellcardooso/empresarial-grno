import Link from "next/link";
import { Suspense } from "react";
import { TratativaReportAsync } from "@/components/relatorios/TratativaReportAsync";
import { TratativaReportFiltersForm } from "@/components/relatorios/TratativaReportFiltersForm";
import { TratativaReportLoading } from "@/components/relatorios/TratativaReportLoading";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  formatRelatorioDateParam,
  parseTratativaReportParams,
} from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{ de?: string; ate?: string; status?: string }>;
};

/** Análise operacional e listagem de tratativas BSOD por status. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseTratativaReportParams(params);
  const reportCacheKey = [
    formatRelatorioDateParam(filters.from),
    formatRelatorioDateParam(filters.to),
    filters.status ?? "all",
  ].join(":");

  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>

      <PageHeader
        title={RELATORIOS_COPY.tratativasPageTitle}
        description={RELATORIOS_COPY.tratativasPageDescription}
      />

      <TratativaReportFiltersForm filters={filters} />

      <Suspense key={reportCacheKey} fallback={<TratativaReportLoading />}>
        <TratativaReportAsync filters={filters} />
      </Suspense>
    </>
  );
}
