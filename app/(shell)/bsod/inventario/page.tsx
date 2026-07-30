import { BsodFilterToolbar } from "@/components/bsod/BsodFilterToolbar";
import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import { BsodScopeNav } from "@/components/bsod/BsodScopeNav";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  bsodFilterSummary,
  bsodUrlStateFromParams,
  buildBsodExportHref,
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
export const metadata = { title: "Inventário BSOD" };

type PageProps = {
  searchParams: Promise<{
    filtro?: string;
    saude?: string;
    cmts?: string;
    node?: string;
    q?: string;
    page?: string;
    tratativa?: string;
    ddd?: string;
  }>;
};

/** Inventário PME completo com saúde SNMP, VLAN, tratativa, CMTS e node. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlState = bsodUrlStateFromParams(params);
  const queryFilters = parseBsodSearchParams(params, { scope: "inventory" });
  const currentPage = bsodPageFromParam(params.page);
  const pageSize = BSOD_LIST_PAGE_SIZE;
  const healthScope = {
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
    opes: queryFilters.opes,
  };
  const vlanScope = {
    health: queryFilters.health,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
    opes: queryFilters.opes,
  };
  const facetScope = {
    health: queryFilters.health,
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
    opes: queryFilters.opes,
  };
  const dddOptions = listBsodDddOptions();

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

    const [rows, total, healthCounts, vlanCounts, cmtsOptions, nodeOptions, dddCountRows] =
      emptyByTratativa
        ? await Promise.all([
            Promise.resolve([]),
            Promise.resolve(0),
            getCachedBsodHealthCounts(healthScope),
            getCachedBsodVlanCounts(vlanScope),
            getCachedBsodCmts(facetScope),
            getCachedBsodNodes(facetScope),
            Promise.all(dddOptions.map((option) => countPmeBsod({ opes: option.opes }))),
          ])
        : await Promise.all([
            listPmeBsod(listFilters),
            countPmeBsod(queryFilters),
            getCachedBsodHealthCounts(healthScope),
            getCachedBsodVlanCounts(vlanScope),
            getCachedBsodCmts(facetScope),
            getCachedBsodNodes(facetScope),
            Promise.all(dddOptions.map((option) => countPmeBsod({ opes: option.opes }))),
          ]);

    const tratativasByKey = await loadTratativasForBsodRows(rows);
    const dddCounts = dddOptions.map((option, index) => ({
      ddd: option.ddd,
      label: option.label,
      total: Number(dddCountRows[index] ?? 0),
    }));

    return (
      <>
        <PageHeader
          title="Inventário BSOD"
          description="Inventário PME completo com saúde SNMP, VLAN e tratativas."
        />
        <BsodScopeNav active="inventory" />
        <BsodFilterToolbar
          healthCounts={healthCounts}
          vlanCounts={vlanCounts}
          cmtsOptions={cmtsOptions}
          nodeOptions={nodeOptions}
          dddCounts={dddCounts}
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
          exportHref={buildBsodExportHref(urlState, { scope: "inventory" })}
          variant="inventory"
          basePath="/bsod/inventario"
        />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
