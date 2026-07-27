import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";
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

/** Lista inventário PME filtrado e une com a última leitura SNMP em memória. */
export async function listMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<PmeBsodRow[]> {
  const { sql: whereSql, params } = buildBsodInventoryWhere(filters, options);
  const [inventoryRows, monitorByMac] = await Promise.all([
    hfcQuery<RowDataPacket[]>(
      `${BSOD_INVENTORY_SELECT}
       ${BSOD_PME_FROM}
       ${whereSql}`,
      params,
    ),
    getLatestMonitorByMac(),
  ]);

  const merged = inventoryRows.map((row) =>
    mapPmeRow(mergeInventoryWithMonitor(row, monitorByMac.get(String(row.mac)))),
  );

  if (!bsodHasHealthFilter(filters, options)) {
    return merged;
  }

  return merged.filter((row) => matchesBsodHealth(row.monitor_status, filters.health));
}
