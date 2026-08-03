import { BSOD_LIST_MAX_PAGE_SIZE, BSOD_LIST_PAGE_SIZE } from "@/lib/config/bsod-pagination";
import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";
import { getLatestMonitorByMac } from "@/lib/queries/bsod-monitor";
import { countMergedPmeRows, listMergedPmeRows } from "@/lib/queries/bsod-rows";
import {
  BSOD_INVENTORY_SELECT,
  BSOD_PME_FROM,
  buildBsodInventoryWhere,
  bsodHasHealthFilter,
  compareBsodRows,
  mapPmeRow,
  mergeInventoryWithMonitor,
  type BsodFilters,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";
import { serializeRows } from "@/lib/serialize";

export type {
  BsodFacetCount,
  BsodFilters,
  BsodHealthCounts,
  BsodHealthFilter,
  BsodListScope,
  BsodVlanCounts,
  BsodVlanFilter,
  PmeBsodRow,
} from "@/lib/queries/bsod-sql";

export {
  getCachedBsodCmts,
  getCachedBsodHealthCounts,
  getCachedBsodNodes,
  getCachedBsodSummary,
  getCachedBsodVlanCounts,
  type BsodSummary,
} from "@/lib/queries/bsod-facets";

/** Conta PME com os mesmos filtros da listagem. */
export async function countPmeBsod(filters: BsodFilters = {}): Promise<number> {
  if (!bsodHasHealthFilter(filters)) {
    const { sql: whereSql, params } = buildBsodInventoryWhere(filters);
    const [row] = await hfcQuery<RowDataPacket[]>(
      `SELECT COUNT(*) AS total ${BSOD_PME_FROM} ${whereSql}`,
      params,
    );
    return Number(row?.total ?? 0);
  }

  return countMergedPmeRows(filters);
}

/** Lista PME do inventário ordenado por saúde, CMTS, node e MAC. */
export async function listPmeBsod(filters: BsodFilters = {}) {
  const limit = Math.min(
    Math.max(filters.limit ?? BSOD_LIST_PAGE_SIZE, 1),
    BSOD_LIST_MAX_PAGE_SIZE,
  );
  const offset = Math.max(filters.offset ?? 0, 0);

  const rows = await listMergedPmeRows(filters);
  rows.sort(compareBsodRows);
  return serializeRows(rows.slice(offset, offset + limit));
}

/** Lista todo inventário BSOD filtrado para exportação CSV. */
export async function listAllPmeBsodForExport(
  filters: Omit<BsodFilters, "limit" | "offset"> = {},
): Promise<PmeBsodRow[]> {
  const rows = await listMergedPmeRows(filters);
  rows.sort(compareBsodRows);
  return serializeRows(rows);
}

/** Busca linha PME por MAC (normalizado em maiúsculas). */
export async function getPmeBsodByMac(mac: string): Promise<PmeBsodRow | null> {
  const normalized = mac.trim().toUpperCase();
  if (!normalized) return null;

  const [inventoryRows, monitorByMac] = await Promise.all([
    hfcQuery<RowDataPacket[]>(
      `${BSOD_INVENTORY_SELECT}
       ${BSOD_PME_FROM}
       WHERE UPPER(i.mac) = ?
       LIMIT 1`,
      [normalized],
    ),
    getLatestMonitorByMac(),
  ]);

  const row = inventoryRows[0];
  if (!row) return null;

  const rawMac = String(row.mac);
  const reading = monitorByMac.get(rawMac) ?? monitorByMac.get(rawMac.toUpperCase());
  return serializeRows([mapPmeRow(mergeInventoryWithMonitor(row, reading))])[0];
}

/** Testa conectividade com o banco hfc-sls. */
export async function pingHfcDb(): Promise<{ ok: boolean; detail: string }> {
  try {
    await hfcQuery(`SELECT 1 AS ok`);
    return { ok: true, detail: "Conexão bem-sucedida." };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
