import {
  BSOD_EXPORT_BATCH_SIZE,
  BSOD_LIST_MAX_PAGE_SIZE,
  BSOD_LIST_PAGE_SIZE,
} from "@/lib/config/bsod-pagination";
import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";
import { serializeRows } from "@/lib/serialize";
import {
  bsodFromClause,
  BSOD_FROM_WITH_MONITOR,
  BSOD_LIST_SELECT,
  buildBsodWhere,
  mapPmeRow,
  type BsodFilters,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";

export type {
  BsodFacetCount,
  BsodFilters,
  BsodHealthCounts,
  BsodHealthFilter,
  BsodVlanFilter,
  PmeBsodRow,
} from "@/lib/queries/bsod-sql";

export {
  getCachedBsodCmts,
  getCachedBsodHealthCounts,
  getCachedBsodNodes,
  getCachedBsodSummary,
  type BsodSummary,
} from "@/lib/queries/bsod-facets";

/** Conta PME com os mesmos filtros da listagem. */
export async function countPmeBsod(filters: BsodFilters = {}): Promise<number> {
  const { sql: whereSql, params } = buildBsodWhere(filters);
  const fromClause = bsodFromClause(filters);
  const [row] = await hfcQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total ${fromClause} ${whereSql}`,
    params,
  );
  return Number(row?.total ?? 0);
}

type ListPmeBsodOptions = BsodFilters & {
  forExport?: boolean;
};

/** Lista PME do inventário ordenado por CMTS, node e MAC. */
export async function listPmeBsod(filters: ListPmeBsodOptions = {}) {
  const { sql: whereSql, params } = buildBsodWhere(filters);
  const maxLimit = filters.forExport ? BSOD_EXPORT_BATCH_SIZE : BSOD_LIST_MAX_PAGE_SIZE;
  const limit = Math.min(Math.max(filters.limit ?? BSOD_LIST_PAGE_SIZE, 1), maxLimit);
  const offset = Math.max(filters.offset ?? 0, 0);
  const sql = `
    ${BSOD_LIST_SELECT}
    ${BSOD_FROM_WITH_MONITOR}
    ${whereSql}
    ORDER BY
      CASE WHEN m.status = 0 THEN 0 WHEN m.status IS NULL THEN 1 ELSE 2 END,
      i.cmts ASC, i.node ASC, i.mac ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const rows = await hfcQuery<RowDataPacket[]>(sql, params);
  return serializeRows(rows.map(mapPmeRow));
}

/** Lista todo inventário BSOD filtrado em lotes para exportação CSV. */
export async function listAllPmeBsodForExport(
  filters: Omit<BsodFilters, "limit" | "offset"> = {},
): Promise<PmeBsodRow[]> {
  const batchSize = BSOD_EXPORT_BATCH_SIZE;
  const allRows: PmeBsodRow[] = [];
  let offset = 0;

  while (true) {
    const batch = await listPmeBsod({
      ...filters,
      limit: batchSize,
      offset,
      forExport: true,
    });
    allRows.push(...batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return allRows;
}

/** Busca linha PME por MAC (normalizado em maiúsculas). */
export async function getPmeBsodByMac(mac: string): Promise<PmeBsodRow | null> {
  const normalized = mac.trim().toUpperCase();
  if (!normalized) return null;

  const rows = await hfcQuery<RowDataPacket[]>(
    `${BSOD_LIST_SELECT}
     ${BSOD_FROM_WITH_MONITOR}
     WHERE UPPER(i.mac) = ?
     LIMIT 1`,
    [normalized],
  );

  const row = rows[0];
  if (!row) return null;
  return serializeRows([mapPmeRow(row)])[0];
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
