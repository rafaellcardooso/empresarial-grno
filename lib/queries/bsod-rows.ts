import type { RowDataPacket } from "mysql2";
import { normalizeTableSearch } from "@/lib/config/table-search";
import { sirQuery } from "@/lib/db/sir";
import { getLatestMonitorByMac } from "@/lib/queries/bsod-monitor";
import {
  BSOD_INVENTORY_SELECT,
  BSOD_PME_FROM,
  bsodHasHealthFilter,
  mapPmeRow,
  matchesBsodHealth,
  mergeInventoryWithMonitor,
  type BsodFilters,
  type BsodWhereOptions,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";

const MERGED_INVENTORY_TTL_MS = 45_000;

type MergedInventoryCacheEntry = {
  expiresAt: number;
  promise: Promise<PmeBsodRow[]>;
};

type BsodMergedInventoryGlobal = typeof globalThis & {
  bsodMergedInventory?: MergedInventoryCacheEntry;
};

/** Indica se o texto da linha contém o termo (case-insensitive). */
function rowFieldContains(value: unknown, termLower: string): boolean {
  if (value == null) return false;
  return String(value).toLowerCase().includes(termLower);
}

/** Aplica em memória os mesmos filtros de inventário + saúde do SQL. */
export function matchesBsodRowFilters(
  row: PmeBsodRow,
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): boolean {
  const omit = new Set(options?.omit ?? []);

  if (!omit.has("vlan") && filters.vlan === "com_vlan") {
    if ((row.bsod_vlan ?? 0) <= 0) return false;
  }
  if (!omit.has("vlan") && filters.vlan === "sem_vlan") {
    if ((row.bsod_vlan ?? 0) > 0) return false;
  }
  if (!omit.has("cmts") && filters.cmts && row.cmts !== filters.cmts) return false;
  if (!omit.has("node") && filters.node && row.node !== filters.node) return false;
  if (!omit.has("ope") && filters.ope && row.ope !== filters.ope) return false;
  if (!omit.has("ope") && filters.opes && filters.opes.length > 0) {
    if (!filters.opes.includes(row.ope)) return false;
  }

  if (filters.macs && filters.macs.length > 0) {
    const macSet = new Set(filters.macs.map((mac) => mac.toUpperCase()));
    if (!macSet.has(String(row.mac).toUpperCase())) return false;
  }
  if (filters.excludeMacs && filters.excludeMacs.length > 0) {
    const excludeSet = new Set(filters.excludeMacs.map((mac) => mac.toUpperCase()));
    if (excludeSet.has(String(row.mac).toUpperCase())) return false;
  }

  if (!omit.has("q")) {
    const term = normalizeTableSearch(filters.q);
    if (term) {
      const termLower = term.toLowerCase();
      const hit =
        rowFieldContains(row.mac, termLower) ||
        rowFieldContains(row.contrato, termLower) ||
        rowFieldContains(row.cliente, termLower) ||
        rowFieldContains(row.cadastro_responsavel, termLower) ||
        rowFieldContains(row.designacao, termLower) ||
        rowFieldContains(row.produto, termLower) ||
        rowFieldContains(row.node, termLower) ||
        rowFieldContains(row.cmts, termLower) ||
        rowFieldContains(row.ope, termLower) ||
        rowFieldContains(row.address, termLower) ||
        rowFieldContains(row.id_cable, termLower) ||
        rowFieldContains(row.profile, termLower) ||
        rowFieldContains(row.vlan, termLower);
      if (!hit) return false;
    }
  }

  if (bsodHasHealthFilter(filters, options)) {
    return matchesBsodHealth(row.monitor_status, filters.health);
  }

  return true;
}

/** Carrega inventário completo unido à última leitura RF. */
async function fetchMergedInventoryAll(): Promise<PmeBsodRow[]> {
  const [inventoryRows, monitorByMac] = await Promise.all([
    sirQuery<RowDataPacket[]>(`${BSOD_INVENTORY_SELECT} ${BSOD_PME_FROM}`),
    getLatestMonitorByMac(),
  ]);

  return inventoryRows.map((row) => {
    const mac = String(row.mac);
    const reading = monitorByMac.get(mac) ?? monitorByMac.get(mac.toUpperCase());
    return mapPmeRow(mergeInventoryWithMonitor(row, reading));
  });
}

/**
 * Inventário PME mesclado com monitor (cache de processo + dedupe in-flight).
 */
export function getMergedInventoryAll(): Promise<PmeBsodRow[]> {
  const g = globalThis as BsodMergedInventoryGlobal;
  const now = Date.now();
  const existing = g.bsodMergedInventory;
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = fetchMergedInventoryAll().catch((err) => {
    if (g.bsodMergedInventory?.promise === promise) {
      g.bsodMergedInventory = undefined;
    }
    throw err;
  });

  g.bsodMergedInventory = {
    expiresAt: now + MERGED_INVENTORY_TTL_MS,
    promise,
  };

  return promise;
}

/** Invalida o cache de inventário mesclado (após escrita manual). */
export function invalidateMergedInventoryCache(): void {
  const g = globalThis as BsodMergedInventoryGlobal;
  g.bsodMergedInventory = undefined;
}

/** Lista inventário PME filtrado a partir do cache mesclado. */
export async function listMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<PmeBsodRow[]> {
  const all = await getMergedInventoryAll();
  return all.filter((row) => matchesBsodRowFilters(row, filters, options));
}

/** Conta PME com os mesmos filtros da listagem (sobre o cache mesclado). */
export async function countMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<number> {
  const rows = await listMergedPmeRows(filters, options);
  return rows.length;
}
