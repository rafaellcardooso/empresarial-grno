import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";
import {
  BSOD_HEALTH_SORT_SQL,
  BSOD_JOINED_SELECT,
  BSOD_PME_FROM,
  buildBsodWhere,
  mapPmeRow,
  type BsodFilters,
  type BsodWhereOptions,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";

/** Lista inventário PME com última leitura SNMP, filtros e ordenação no SQL. */
export async function listMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<PmeBsodRow[]> {
  const { sql: whereSql, params } = buildBsodWhere(filters, options);
  const limit = filters.limit;
  const offset = filters.offset ?? 0;

  let sql = `
    ${BSOD_JOINED_SELECT}
    ${BSOD_PME_FROM}
    ${whereSql}
    ORDER BY ${BSOD_HEALTH_SORT_SQL}, i.cmts ASC, i.node ASC, i.mac ASC
  `;
  const queryParams = [...params];

  if (limit != null) {
    sql += ` LIMIT ? OFFSET ?`;
    queryParams.push(Math.max(limit, 1), Math.max(offset, 0));
  }

  const rows = await hfcQuery<RowDataPacket[]>(sql, queryParams);
  return rows.map((row) => mapPmeRow(row));
}

/** Conta PME com os mesmos filtros da listagem (saúde incluída no SQL). */
export async function countMergedPmeRows(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): Promise<number> {
  const { sql: whereSql, params } = buildBsodWhere(filters, options);
  const [row] = await hfcQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total ${BSOD_PME_FROM} ${whereSql}`,
    params,
  );
  return Number(row?.total ?? 0);
}
