import { BSOD_LIST_MAX_PAGE_SIZE, BSOD_LIST_PAGE_SIZE } from "@/lib/config/bsod-pagination";
import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";
import { countMergedPmeRows, listMergedPmeRows } from "@/lib/queries/bsod-rows";
import {
  BSOD_JOINED_SELECT,
  BSOD_PME_FROM,
  mapPmeRow,
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
  return countMergedPmeRows(filters);
}

/** Lista PME do inventário ordenado por saúde, CMTS, node e MAC. */
export async function listPmeBsod(filters: BsodFilters = {}) {
  const limit = Math.min(
    Math.max(filters.limit ?? BSOD_LIST_PAGE_SIZE, 1),
    BSOD_LIST_MAX_PAGE_SIZE,
  );
  const offset = Math.max(filters.offset ?? 0, 0);

  const rows = await listMergedPmeRows({ ...filters, limit, offset });
  return serializeRows(rows);
}

/** Lista todo inventário BSOD filtrado para exportação CSV. */
export async function listAllPmeBsodForExport(
  filters: Omit<BsodFilters, "limit" | "offset"> = {},
): Promise<PmeBsodRow[]> {
  const rows = await listMergedPmeRows(filters);
  return serializeRows(rows);
}

/** Busca linha PME por MAC (normalizado em maiúsculas). */
export async function getPmeBsodByMac(mac: string): Promise<PmeBsodRow | null> {
  const normalized = mac.trim().toUpperCase();
  if (!normalized) return null;

  const inventoryRows = await hfcQuery<RowDataPacket[]>(
    `${BSOD_JOINED_SELECT}
     ${BSOD_PME_FROM}
     WHERE UPPER(i.mac) = ?
     LIMIT 1`,
    [normalized],
  );

  const row = inventoryRows[0];
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
