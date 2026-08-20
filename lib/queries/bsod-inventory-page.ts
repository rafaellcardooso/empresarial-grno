import { listBsodDddOptions } from "@/lib/config/bsod-locations";
import { BSOD_LIST_PAGE_SIZE, bsodListOffset } from "@/lib/config/bsod-pagination";
import { getMergedInventoryAll, matchesBsodRowFilters } from "@/lib/queries/bsod-rows";
import {
  compareBsodRows,
  type BsodFacetCount,
  type BsodFilters,
  type BsodHealthCounts,
  type BsodVlanCounts,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";
import { serializeRows } from "@/lib/serialize";

export type BsodInventoryPageData = {
  rows: PmeBsodRow[];
  total: number;
  healthCounts: BsodHealthCounts;
  vlanCounts: BsodVlanCounts;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  dddCounts: Array<{ ddd: string; label: string; total: number }>;
};

/** Conta facet CMTS/node a partir de linhas já filtradas. */
function facetCountsFromRows(rows: PmeBsodRow[], field: "cmts" | "node"): BsodFacetCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const raw = String(row[field] ?? "").trim();
    if (!raw) continue;
    totals.set(raw, (totals.get(raw) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([value, total]) => ({ value, total }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** Pagina linhas já ordenadas. */
function paginateRows(rows: PmeBsodRow[], page: number, pageSize: number): PmeBsodRow[] {
  const offset = bsodListOffset(page, pageSize);
  return serializeRows(rows.slice(offset, offset + pageSize));
}

type LoadBsodInventoryPageInput = {
  queryFilters: BsodFilters;
  currentPage: number;
  pageSize?: number;
  empty?: boolean;
};

/**
 * Monta listagem, KPIs e facets do inventário BSOD a partir de uma
 * única carga do inventário mesclado (cache de processo).
 */
export async function loadBsodInventoryPageData(
  input: LoadBsodInventoryPageInput,
): Promise<BsodInventoryPageData> {
  const pageSize = input.pageSize ?? BSOD_LIST_PAGE_SIZE;
  const all = await getMergedInventoryAll();
  const dddOptions = listBsodDddOptions();
  const filters = input.queryFilters;

  const healthScope: BsodFilters = {
    vlan: filters.vlan,
    cmts: filters.cmts,
    node: filters.node,
    ope: filters.ope,
    opes: filters.opes,
    macs: filters.macs,
    excludeMacs: filters.excludeMacs,
  };
  const vlanScope: BsodFilters = {
    health: filters.health,
    cmts: filters.cmts,
    node: filters.node,
    ope: filters.ope,
    opes: filters.opes,
    macs: filters.macs,
    excludeMacs: filters.excludeMacs,
  };
  const facetBase: BsodFilters = {
    health: filters.health,
    vlan: filters.vlan,
    ope: filters.ope,
    opes: filters.opes,
    macs: filters.macs,
    excludeMacs: filters.excludeMacs,
  };

  let online = 0;
  let offline = 0;
  let semLeitura = 0;
  let healthTotal = 0;
  let vlanTotal = 0;
  let comVlan = 0;
  const cmtsFacetRows: PmeBsodRow[] = [];
  const nodeFacetRows: PmeBsodRow[] = [];
  const listRows: PmeBsodRow[] = [];
  const dddTotals = new Map<string, number>();
  for (const option of dddOptions) {
    dddTotals.set(option.ddd, 0);
  }

  for (const row of all) {
    for (const option of dddOptions) {
      if (option.opes.includes(row.ope)) {
        dddTotals.set(option.ddd, (dddTotals.get(option.ddd) ?? 0) + 1);
      }
    }

    if (matchesBsodRowFilters(row, healthScope, { omit: ["health", "q"] })) {
      healthTotal += 1;
      if (row.monitor_status === 1) online += 1;
      else if (row.monitor_status === 0) offline += 1;
      else semLeitura += 1;
    }

    if (matchesBsodRowFilters(row, vlanScope, { omit: ["vlan", "q"] })) {
      vlanTotal += 1;
      if ((row.bsod_vlan ?? 0) > 0) comVlan += 1;
    }

    if (matchesBsodRowFilters(row, facetBase, { omit: ["cmts", "node", "q"] })) {
      cmtsFacetRows.push(row);
    }

    if (matchesBsodRowFilters(row, { ...facetBase, cmts: filters.cmts }, { omit: ["node", "q"] })) {
      nodeFacetRows.push(row);
    }

    if (!input.empty && matchesBsodRowFilters(row, filters)) {
      listRows.push(row);
    }
  }

  listRows.sort(compareBsodRows);

  return {
    rows: input.empty ? [] : paginateRows(listRows, input.currentPage, pageSize),
    total: input.empty ? 0 : listRows.length,
    healthCounts: {
      total: healthTotal,
      online,
      offline,
      sem_leitura: semLeitura,
    },
    vlanCounts: {
      total: vlanTotal,
      com_vlan: comVlan,
      sem_vlan: vlanTotal - comVlan,
    },
    cmtsOptions: facetCountsFromRows(cmtsFacetRows, "cmts"),
    nodeOptions: facetCountsFromRows(nodeFacetRows, "node"),
    dddCounts: dddOptions.map((option) => ({
      ddd: option.ddd,
      label: option.label,
      total: dddTotals.get(option.ddd) ?? 0,
    })),
  };
}
