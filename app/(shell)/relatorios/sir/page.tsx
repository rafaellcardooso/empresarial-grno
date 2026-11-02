import Link from "next/link";
import { Suspense } from "react";
import { SirReportAsync } from "@/components/relatorios/SirReportAsync";
import { SirReportFiltersForm } from "@/components/relatorios/SirReportFiltersForm";
import { SirReportLoading } from "@/components/relatorios/SirReportLoading";
import { PageHeader } from "@/components/ui/PageHeader";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { parseSirReportParams, sirConcludedScopeFromParam } from "@/lib/config/sir-report-filters";
import { sirConcludedPageFromParam } from "@/lib/config/sir-report-pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "SIR" };

type PageProps = {
  searchParams: Promise<{
    de?: string;
    ate?: string;
    dominio?: string;
    tratativa?: string;
    ddd?: string;
    concluidosPage?: string;
    concluidosEscopo?: string;
  }>;
};

/** Análise do backlog SIR, aberturas/conclusões e listagem de concluídos. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseSirReportParams(params);
  const concluidosPage = sirConcludedPageFromParam(params.concluidosPage);
  const concluidosEscopo = sirConcludedScopeFromParam(params.concluidosEscopo);
  const reportCacheKey = [
    formatRelatorioDateParam(filters.from),
    formatRelatorioDateParam(filters.to),
    filters.domain,
    filters.tratativa ?? "all",
    filters.ddd ?? "all",
    String(concluidosPage),
    concluidosEscopo ?? "all",
  ].join(":");

  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>

      <PageHeader
        title={RELATORIOS_COPY.sirPageTitle}
        description={RELATORIOS_COPY.sirPageDescription}
      />

      <SirReportFiltersForm filters={filters} />

      <Suspense key={reportCacheKey} fallback={<SirReportLoading />}>
        <SirReportAsync
          filters={filters}
          concluidosPage={concluidosPage}
          concluidosEscopo={concluidosEscopo}
        />
      </Suspense>
    </>
  );
}
