import { listBsodDddOptions } from "@/lib/config/bsod-locations";
import { BSOD_LIST_PAGE_SIZE, bsodListOffset } from "@/lib/config/bsod-pagination";
import { getMergedInventoryAll, matchesBsodRowFilters } from "@/lib/queries/bsod-rows";
import {
  compareBsodRows,
  type BsodFacetCount,
  type BsodFilters,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";
import { serializeRows } from "@/lib/serialize";

export type BsodAlarmPageData = {
  rows: PmeBsodRow[];
  total: number;
  normalizedRows: PmeBsodRow[];
  normalizedTotal: number;
  kpiTotal: number;
  kpiPending: number;
  kpiInProgress: number;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  dddCounts: Array<{ ddd: string; label: string; total: number }>;
};

/** Conta ocorrências de um campo facet a partir de linhas já filtradas. */
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

/** Pagina linhas já ordenadas no tamanho padrão da listagem BSOD. */
function paginateRows(rows: PmeBsodRow[], page: number, pageSize: number): PmeBsodRow[] {
  const offset = bsodListOffset(page, pageSize);
  return serializeRows(rows.slice(offset, offset + pageSize));
}

type LoadBsodAlarmPageInput = {
  queryFilters: BsodFilters;
  scopedFilters: BsodFilters;
  empty: boolean;
  activeMacs: string[];
  currentPage: number;
  normalizedPage: number;
  pageSize?: number;
};

/**
 * Monta listagens, KPIs e facets do monitor de alarmes a partir de uma
 * única carga do inventário mesclado (cache de processo).
 */
export async function loadBsodAlarmPageData(
  input: LoadBsodAlarmPageInput,
): Promise<BsodAlarmPageData> {
  const pageSize = input.pageSize ?? BSOD_LIST_PAGE_SIZE;
  const activeMacSet = new Set(input.activeMacs.map((mac) => mac.toUpperCase()));
  const all = await getMergedInventoryAll();
  const dddOptions = listBsodDddOptions();

  const baseOfflineScope: BsodFilters = {
    health: "offline",
    opes: input.queryFilters.opes,
    cmts: input.queryFilters.cmts,
    node: input.queryFilters.node,
    q: input.queryFilters.q,
  };

  const offlineRows: PmeBsodRow[] = [];
  const facetRows: PmeBsodRow[] = [];
  const scopedRows: PmeBsodRow[] = [];
  const normalizedCandidates: PmeBsodRow[] = [];
  const dddTotals = new Map<string, number>();
  for (const option of dddOptions) {
    dddTotals.set(option.ddd, 0);
  }

  for (const row of all) {
    const isOffline = row.monitor_status === 0;
    const isOnline = row.monitor_status === 1;

    if (isOffline) {
      for (const option of dddOptions) {
        if (option.opes.includes(row.ope)) {
          dddTotals.set(option.ddd, (dddTotals.get(option.ddd) ?? 0) + 1);
        }
      }
    }

    if (matchesBsodRowFilters(row, baseOfflineScope)) {
      offlineRows.push(row);
    }

    if (
      matchesBsodRowFilters(row, {
        health: "offline",
        opes: input.queryFilters.opes,
        cmts: input.queryFilters.cmts,
        node: input.queryFilters.node,
      })
    ) {
      facetRows.push(row);
    }

    if (!input.empty && matchesBsodRowFilters(row, input.scopedFilters)) {
      scopedRows.push(row);
    }

    if (
      input.activeMacs.length > 0 &&
      isOnline &&
      matchesBsodRowFilters(row, {
        health: "online",
        opes: input.queryFilters.opes,
        macs: input.activeMacs,
      })
    ) {
      normalizedCandidates.push(row);
    }
  }

  let kpiInProgress = 0;
  let kpiPending = 0;
  for (const row of offlineRows) {
    if (activeMacSet.has(String(row.mac).toUpperCase())) {
      kpiInProgress += 1;
    } else {
      kpiPending += 1;
    }
  }

  scopedRows.sort(compareBsodRows);
  normalizedCandidates.sort(compareBsodRows);

  return {
    rows: input.empty ? [] : paginateRows(scopedRows, input.currentPage, pageSize),
    total: input.empty ? 0 : scopedRows.length,
    normalizedRows: paginateRows(normalizedCandidates, input.normalizedPage, pageSize),
    normalizedTotal: normalizedCandidates.length,
    kpiTotal: offlineRows.length,
    kpiPending,
    kpiInProgress,
    cmtsOptions: facetCountsFromRows(facetRows, "cmts"),
    nodeOptions: facetCountsFromRows(facetRows, "node"),
    dddCounts: dddOptions.map((option) => ({
      ddd: option.ddd,
      label: option.label,
      total: dddTotals.get(option.ddd) ?? 0,
    })),
  };
}
