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
import { BSOD_LIST_PAGE_SIZE, bsodPageFromParam } from "@/lib/config/bsod-pagination";
import { loadBsodInventoryPageData } from "@/lib/queries/bsod-inventory-page";
import { getActiveBsodTratativaIndex } from "@/lib/queries/tratativa-chamados";
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

  try {
    const tratativaIndex = await getActiveBsodTratativaIndex();
    if (urlState.tratativa) {
      queryFilters.macs = tratativaIndex.macsByStatus[urlState.tratativa] ?? [];
    }

    const emptyByTratativa = Boolean(urlState.tratativa && (queryFilters.macs?.length ?? 0) === 0);

    const data = await loadBsodInventoryPageData({
      queryFilters,
      currentPage,
      pageSize,
      empty: emptyByTratativa,
    });

    const tratativasByKey = await loadTratativasForBsodRows(data.rows);

    return (
      <>
        <PageHeader
          title="Inventário BSOD"
          description="Inventário PME completo com saúde SNMP, VLAN e tratativas."
        />
        <BsodScopeNav active="inventory" />
        <BsodFilterToolbar
          healthCounts={data.healthCounts}
          vlanCounts={data.vlanCounts}
          cmtsOptions={data.cmtsOptions}
          nodeOptions={data.nodeOptions}
          dddCounts={data.dddCounts}
          tratativaCounts={tratativaIndex.counts}
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
