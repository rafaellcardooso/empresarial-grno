import { BsodFilterToolbar } from "@/components/bsod/BsodFilterToolbar";
import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import {
  bsodFilterSummary,
  bsodUrlStateFromParams,
  parseBsodSearchParams,
} from "@/lib/config/bsod-filters";
import { countBsodHealth, listBsodCmts, listBsodNodes, listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{
    filtro?: string;
    saude?: string;
    cmts?: string;
    node?: string;
  }>;
};

/** Inventário PME filtrado por saúde, CMTS e node. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlState = bsodUrlStateFromParams(params);
  const queryFilters = parseBsodSearchParams(params);
  const scopeFilters = {
    health: queryFilters.health,
    vlan: queryFilters.vlan,
    cmts: queryFilters.cmts,
    node: queryFilters.node,
    ope: queryFilters.ope,
  };

  try {
    const [rows, healthCounts, cmtsOptions, nodeOptions] = await Promise.all([
      listPmeBsod(queryFilters),
      countBsodHealth(scopeFilters),
      listBsodCmts(scopeFilters),
      listBsodNodes(scopeFilters),
    ]);

    return (
      <>
        <BsodFilterToolbar
          healthCounts={healthCounts}
          cmtsOptions={cmtsOptions}
          nodeOptions={nodeOptions}
          activeState={urlState}
        />
        <BsodInventoryTable rows={rows} filterSummary={bsodFilterSummary(urlState)} />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
