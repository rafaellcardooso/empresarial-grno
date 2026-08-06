import type { RowDataPacket } from "mysql2";
import { sirQuery } from "@/lib/db/sir";
import { getLatestMonitorByMac } from "@/lib/queries/bsod-monitor";
import {
  BSOD_INVENTORY_SELECT,
  BSOD_PME_FROM,
  buildBsodInventoryWhere,
  bsodHasHealthFilter,
  mapPmeRow,
  matchesBsodHealth,
  mergeInventoryWithMonitor,
  type BsodFilters,
  type BsodWhereOptions,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";

/** Lista inventário PME filtrado e une com a última leitura RF em memória. */
export async function listMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<PmeBsodRow[]> {
  const { sql: whereSql, params } = buildBsodInventoryWhere(filters, options);
  const [inventoryRows, monitorByMac] = await Promise.all([
    sirQuery<RowDataPacket[]>(
      `${BSOD_INVENTORY_SELECT}
       ${BSOD_PME_FROM}
       ${whereSql}`,
      params,
    ),
    getLatestMonitorByMac(),
  ]);

  const merged = inventoryRows.map((row) => {
    const mac = String(row.mac);
    const reading = monitorByMac.get(mac) ?? monitorByMac.get(mac.toUpperCase());
    return mapPmeRow(mergeInventoryWithMonitor(row, reading));
  });

  if (!bsodHasHealthFilter(filters, options)) {
    return merged;
  }

  return merged.filter((row) => matchesBsodHealth(row.monitor_status, filters.health));
}

/** Conta PME com os mesmos filtros da listagem (saúde em memória quando necessário). */
export async function countMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<number> {
  if (!bsodHasHealthFilter(filters, options)) {
    const { sql: whereSql, params } = buildBsodInventoryWhere(filters, options);
    const [row] = await sirQuery<RowDataPacket[]>(
      `SELECT COUNT(*) AS total ${BSOD_PME_FROM} ${whereSql}`,
      params,
    );
    return Number(row?.total ?? 0);
  }

  const rows = await listMergedPmeRows(filters, options);
  return rows.length;
}
