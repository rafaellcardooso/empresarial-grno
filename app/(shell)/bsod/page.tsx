import { BsodFilterToolbar } from "@/components/bsod/BsodFilterToolbar";
import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import {
  bsodFilterSummary,
  bsodUrlStateFromParams,
  buildBsodExportHref,
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
  getCachedBsodVlanCounts,
  listPmeBsod,
} from "@/lib/queries/bsod";
import {
  countActiveBsodByChamadoStatus,
  listActiveBsodKeysByChamadoStatus,
} from "@/lib/queries/tratativa-chamados";
import { loadTratativasForBsodRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{
    filtro?: string;
    saude?: string;
    cmts?: string;
    node?: string;
    q?: string;
    page?: string;
    tratativa?: string;
  }>;
};

/** Inventário PME filtrado por saúde, VLAN, tratativa, CMTS e node. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlState = bsodUrlStateFromParams(params);
  const queryFilters = parseBsodSearchParams(params);
  const currentPage = bsodPageFromParam(params.page);
  const pageSize = BSOD_LIST_PAGE_SIZE;
  const healthScope = {
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
  };
  const vlanScope = {
    health: queryFilters.health,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
  };
  const facetScope = {
    health: queryFilters.health,
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
  };

  try {
    const [tratativaCounts, tratativaMacs] = await Promise.all([
      countActiveBsodByChamadoStatus(),
      urlState.tratativa
        ? listActiveBsodKeysByChamadoStatus(urlState.tratativa)
        : Promise.resolve<string[] | null>(null),
    ]);

    if (tratativaMacs) {
      queryFilters.macs = tratativaMacs;
    }

    const emptyByTratativa = Boolean(tratativaMacs && tratativaMacs.length === 0);

    const listFilters = {
      ...queryFilters,
      limit: pageSize,
      offset: bsodListOffset(currentPage, pageSize),
    };

    const [rows, total, healthCounts, vlanCounts, cmtsOptions, nodeOptions] = emptyByTratativa
      ? await Promise.all([
          Promise.resolve([]),
          Promise.resolve(0),
          getCachedBsodHealthCounts(healthScope),
          getCachedBsodVlanCounts(vlanScope),
          getCachedBsodCmts(facetScope),
          getCachedBsodNodes(facetScope),
        ])
      : await Promise.all([
          listPmeBsod(listFilters),
          countPmeBsod(queryFilters),
          getCachedBsodHealthCounts(healthScope),
          getCachedBsodVlanCounts(vlanScope),
          getCachedBsodCmts(facetScope),
          getCachedBsodNodes(facetScope),
        ]);

    const tratativasByKey = await loadTratativasForBsodRows(rows);

    return (
      <>
        <BsodFilterToolbar
          healthCounts={healthCounts}
          vlanCounts={vlanCounts}
          cmtsOptions={cmtsOptions}
          nodeOptions={nodeOptions}
          tratativaCounts={tratativaCounts}
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
