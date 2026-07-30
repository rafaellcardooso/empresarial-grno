import { SdhPanel } from "@/components/sdh/SdhPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  parseSdhDddParam,
  parseSdhSearchParam,
  parseSdhStatusParam,
  parseSdhVendorParam,
  buildSdhExportHref,
} from "@/lib/config/sdh-filters";
import { SDH_LIST_PAGE_SIZE, sdhListOffset, sdhPageFromParam } from "@/lib/config/sdh-pagination";
import {
  countActiveSdhAlarms,
  countSdhByDdd,
  countSdhByStatus,
  countSdhByVendor,
  listActiveSdhAlarms,
} from "@/lib/queries/sdh";

export const dynamic = "force-dynamic";
export const metadata = { title: "SDH" };

type PageProps = {
  searchParams: Promise<{
    vendor?: string;
    ddd?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
};

/** Página de monitoramento SDH (alarmes TMIP >6h). */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const vendor = parseSdhVendorParam(params.vendor);
  const ddd = parseSdhDddParam(params.ddd);
  const status = parseSdhStatusParam(params.status);
  const q = parseSdhSearchParam(params.q);
  const currentPage = sdhPageFromParam(params.page);
  const pageSize = SDH_LIST_PAGE_SIZE;
  const filters = {
    vendor,
    ddd,
    status,
    q,
    limit: pageSize,
    offset: sdhListOffset(currentPage, pageSize),
  };

  const [rows, total, vendorCounts, dddCounts, statusCounts] = await Promise.all([
    listActiveSdhAlarms(filters),
    countActiveSdhAlarms(filters),
    countSdhByVendor(),
    countSdhByDdd(vendor),
    countSdhByStatus({ vendor, ddd, q }),
  ]);

  return (
    <>
      <PageHeader
        title="SDH"
        description="Alarmes SDH (TMIP) com mais de 6 horas — filtros por gerência e DDD."
      />
      <SdhPanel
        rows={rows}
        total={total}
        vendorCounts={vendorCounts}
        dddCounts={dddCounts}
        statusCounts={statusCounts}
        activeVendor={vendor}
        activeDdd={ddd}
        activeStatus={status}
        activeQ={q}
        currentPage={currentPage}
        pageSize={pageSize}
        exportHref={buildSdhExportHref({ vendor, ddd, status, q })}
      />
    </>
  );
}
