import { BsodAlarmToolbar } from "@/components/bsod/BsodAlarmToolbar";
import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import { BsodNormalizedTreatments } from "@/components/bsod/BsodNormalizedTreatments";
import { BsodScopeNav } from "@/components/bsod/BsodScopeNav";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  bsodFilterSummary,
  bsodUrlStateFromParams,
  buildBsodExportHref,
  defaultBsodAlarmDdd,
  parseBsodSearchParams,
} from "@/lib/config/bsod-filters";
import { BSOD_LIST_PAGE_SIZE, bsodPageFromParam } from "@/lib/config/bsod-pagination";
import { loadBsodAlarmPageData } from "@/lib/queries/bsod-alarms-page";
import type { BsodFilters } from "@/lib/queries/bsod";
import { listActiveBsodKeys } from "@/lib/queries/tratativa-chamados";
import { loadTratativasForBsodRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{
    cmts?: string;
    node?: string;
    q?: string;
    page?: string;
    ddd?: string;
    status?: string;
    normalizedPage?: string;
  }>;
};

/** Aplica filtro operacional pendente / em tratativa sobre MACs ativos. */
function applyAlarmStatusFilter(
  filters: BsodFilters,
  status: string | undefined,
  activeMacs: string[],
): { filters: BsodFilters; empty: boolean } {
  if (status === "pendente") {
    if (activeMacs.length === 0) return { filters, empty: false };
    return { filters: { ...filters, excludeMacs: activeMacs }, empty: false };
  }
  if (status === "em-tratativa") {
    if (activeMacs.length === 0) return { filters, empty: true };
    return { filters: { ...filters, macs: activeMacs }, empty: false };
  }
  return { filters, empty: false };
}

/** Monitor operacional de modems PME atualmente offline. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsedState = bsodUrlStateFromParams(params);
  const urlState = {
    ...parsedState,
    ddd: parsedState.ddd ?? defaultBsodAlarmDdd(),
  };
  const queryFilters = parseBsodSearchParams(params, { scope: "alarms" });
  const currentPage = bsodPageFromParam(params.page);
  const normalizedPage = bsodPageFromParam(params.normalizedPage);
  const pageSize = BSOD_LIST_PAGE_SIZE;

  try {
    const activeMacs = await listActiveBsodKeys();
    const { filters: scopedFilters, empty } = applyAlarmStatusFilter(
      queryFilters,
      urlState.status,
      activeMacs,
    );

    const data = await loadBsodAlarmPageData({
      queryFilters,
      scopedFilters,
      empty,
      activeMacs,
      currentPage,
      normalizedPage,
      pageSize,
    });

    const [tratativasByKey, normalizedTratativasByKey] = await Promise.all([
      loadTratativasForBsodRows(data.rows),
      loadTratativasForBsodRows(data.normalizedRows),
    ]);

    return (
      <>
        <PageHeader title="BSOD" description="Modems PME offline — escopo inicial DDD 98 (MA)." />
        <BsodScopeNav active="alarms" />
        <BsodAlarmToolbar
          kpiCounts={{
            total: data.kpiTotal,
            pending: data.kpiPending,
            inProgress: data.kpiInProgress,
          }}
          dddCounts={data.dddCounts}
          cmtsOptions={data.cmtsOptions}
          nodeOptions={data.nodeOptions}
          activeState={urlState}
        />
        <BsodInventoryTable
          rows={data.rows}
          tratativasByKey={tratativasByKey}
          total={data.total}
          currentPage={currentPage}
          pageSize={pageSize}
          activeUrlState={urlState}
          filterSummary={bsodFilterSummary(urlState)}
          exportHref={buildBsodExportHref(urlState, { scope: "alarms" })}
          variant="alarms"
          basePath="/bsod"
        />
        <BsodNormalizedTreatments
          rows={data.normalizedRows}
          tratativasByKey={normalizedTratativasByKey}
          total={data.normalizedTotal}
          currentPage={normalizedPage}
          pageSize={pageSize}
          activeUrlState={urlState}
        />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
