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
import { listBsodDddOptions } from "@/lib/config/bsod-locations";
import {
  BSOD_LIST_PAGE_SIZE,
  bsodListOffset,
  bsodPageFromParam,
} from "@/lib/config/bsod-pagination";
import {
  countPmeBsod,
  getCachedBsodCmts,
  getCachedBsodNodes,
  listPmeBsod,
  type BsodFilters,
} from "@/lib/queries/bsod";
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
  const facetScope: BsodFilters = {
    health: "offline",
    opes: queryFilters.opes,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
  };

  try {
    const activeMacs = await listActiveBsodKeys();
    const { filters: scopedFilters, empty } = applyAlarmStatusFilter(
      queryFilters,
      urlState.status,
      activeMacs,
    );

    const listFilters = {
      ...scopedFilters,
      limit: pageSize,
      offset: bsodListOffset(currentPage, pageSize),
    };

    const baseOffline: BsodFilters = {
      health: "offline",
      opes: queryFilters.opes,
      cmts: queryFilters.cmts,
      node: queryFilters.node,
      q: queryFilters.q,
    };

    const dddOptions = listBsodDddOptions();
    const normalizedFilters: BsodFilters = {
      health: "online",
      opes: queryFilters.opes,
      macs: activeMacs,
    };

    const [
      rows,
      total,
      normalizedRows,
      normalizedTotal,
      kpiTotal,
      kpiPending,
      kpiInProgress,
      cmtsOptions,
      nodeOptions,
      dddCountRows,
    ] = await Promise.all([
      empty ? Promise.resolve([]) : listPmeBsod(listFilters),
      empty ? Promise.resolve(0) : countPmeBsod(scopedFilters),
      activeMacs.length
        ? listPmeBsod({
            ...normalizedFilters,
            limit: pageSize,
            offset: bsodListOffset(normalizedPage, pageSize),
          })
        : Promise.resolve([]),
      activeMacs.length ? countPmeBsod(normalizedFilters) : Promise.resolve(0),
      countPmeBsod(baseOffline),
      countPmeBsod(activeMacs.length ? { ...baseOffline, excludeMacs: activeMacs } : baseOffline),
      activeMacs.length ? countPmeBsod({ ...baseOffline, macs: activeMacs }) : Promise.resolve(0),
      getCachedBsodCmts(facetScope),
      getCachedBsodNodes(facetScope),
      Promise.all(
        dddOptions.map((option) => countPmeBsod({ health: "offline", opes: option.opes })),
      ),
    ]);

    const [tratativasByKey, normalizedTratativasByKey] = await Promise.all([
      loadTratativasForBsodRows(rows),
      loadTratativasForBsodRows(normalizedRows),
    ]);
    const dddCounts = dddOptions.map((option, index) => ({
      ddd: option.ddd,
      label: option.label,
      total: Number(dddCountRows[index] ?? 0),
    }));

    return (
      <>
        <PageHeader
          title="BSOD"
          description="Modems PME com última leitura SNMP offline — escopo inicial DDD 98 (MA)."
        />
        <BsodScopeNav active="alarms" />
        <BsodAlarmToolbar
          kpiCounts={{
            total: kpiTotal,
            pending: kpiPending,
            inProgress: kpiInProgress,
          }}
          dddCounts={dddCounts}
          cmtsOptions={cmtsOptions}
          nodeOptions={nodeOptions}
          activeState={urlState}
        />
        <BsodInventoryTable
          rows={rows}
          tratativasByKey={tratativasByKey}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          activeUrlState={urlState}
          filterSummary={bsodFilterSummary(urlState)}
          exportHref={buildBsodExportHref(urlState, { scope: "alarms" })}
          variant="alarms"
          basePath="/bsod"
        />
        <BsodNormalizedTreatments
          rows={normalizedRows}
          tratativasByKey={normalizedTratativasByKey}
          total={normalizedTotal}
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
