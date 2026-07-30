import Link from "next/link";
import { Suspense } from "react";
import { SdhReportAsync } from "@/components/relatorios/SdhReportAsync";
import { SdhReportFiltersForm } from "@/components/relatorios/SdhReportFiltersForm";
import { SdhReportLoading } from "@/components/relatorios/SdhReportLoading";
import { PageHeader } from "@/components/ui/PageHeader";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { parseSdhReportParams } from "@/lib/config/sdh-report-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "SDH" };

type PageProps = {
  searchParams: Promise<{
    de?: string;
    ate?: string;
    vendor?: string;
    ddd?: string;
  }>;
};

/** Análise do backlog SDH ativo e atividade de tratativa no período. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseSdhReportParams(params);
  const reportCacheKey = [
    formatRelatorioDateParam(filters.from),
    formatRelatorioDateParam(filters.to),
    filters.vendor ?? "all",
    filters.ddd ?? "all",
  ].join(":");

  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>

      <PageHeader
        title={RELATORIOS_COPY.sdhPageTitle}
        description={RELATORIOS_COPY.sdhPageDescription}
      />

      <SdhReportFiltersForm filters={filters} />

      <Suspense key={reportCacheKey} fallback={<SdhReportLoading />}>
        <SdhReportAsync filters={filters} />
      </Suspense>
    </>
  );
}
