import { BsodFilterToolbar } from "@/components/bsod/BsodFilterToolbar";
import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import {
  bsodFilterSummary,
  bsodUrlStateFromParams,
  buildBsodExportHref,
  buildBsodHref,
  parseBsodSearchParams,
} from "@/lib/config/bsod-filters";
import {
  BSOD_LIST_PAGE_SIZE,
  bsodListOffset,
  bsodPageFromParam,
} from "@/lib/config/bsod-pagination";
import {
  countPmeBsod,
  getCachedBsodCmts,
  getCachedBsodHealthCounts,
  getCachedBsodNodes,
  listPmeBsod,
} from "@/lib/queries/bsod";
import { loadTratativasForBsodRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{
    filtro?: string;
    saude?: string;
    cmts?: string;
    node?: string;
    page?: string;
  }>;
};

/** Inventário PME filtrado por saúde, CMTS e node. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlState = bsodUrlStateFromParams(params);
  const queryFilters = parseBsodSearchParams(params);
  const currentPage = bsodPageFromParam(params.page);
  const pageSize = BSOD_LIST_PAGE_SIZE;
  const scopeFilters = {
    health: queryFilters.health,
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
  };
  const listFilters = {
    ...queryFilters,
    limit: pageSize,
    offset: bsodListOffset(currentPage, pageSize),
  };

  try {
    const [rows, total, healthCounts, cmtsOptions, nodeOptions] = await Promise.all([
      listPmeBsod(listFilters),
      countPmeBsod(queryFilters),
      getCachedBsodHealthCounts(scopeFilters),
      getCachedBsodCmts(scopeFilters),
      getCachedBsodNodes(scopeFilters),
    ]);
    const tratativasByKey = await loadTratativasForBsodRows(rows);

    return (
      <>
        <BsodFilterToolbar
          healthCounts={healthCounts}
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
          exportHref={buildBsodExportHref(urlState)}
        />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
