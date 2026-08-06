import type { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";
import { sirQuery } from "@/lib/db/sir";
import { listMergedPmeRows } from "@/lib/queries/bsod-rows";
import {
  appendWhereCondition,
  BSOD_PME_FROM,
  buildBsodInventoryWhere,
  bsodHasHealthFilter,
  type BsodFacetCount,
  type BsodFilters,
  type BsodHealthCounts,
  type BsodVlanCounts,
  type BsodWhereOptions,
  type PmeBsodRow,
} from "@/lib/queries/bsod-sql";

const BSOD_CACHE_SEC = 30;

/** Conta PME por saúde respeitando filtros de CMTS, node e VLAN. */
export async function countBsodHealth(
  filters: Omit<BsodFilters, "health" | "limit" | "offset"> = {},
): Promise<BsodHealthCounts> {
  const rows = await listMergedPmeRows(filters, { omit: ["health", "q"] });

  let online = 0;
  let offline = 0;
  let semLeitura = 0;

  for (const row of rows) {
    if (row.monitor_status === 1) online += 1;
    else if (row.monitor_status === 0) offline += 1;
    else semLeitura += 1;
  }

  return {
    total: rows.length,
    online,
    offline,
    sem_leitura: semLeitura,
  };
}

/** Agrupa contagens de facet a partir de linhas já mescladas. */
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

/** Lista CMTS distintos com contagem, respeitando filtros exceto CMTS/node. */
export async function listBsodCmts(
  filters: Omit<BsodFilters, "cmts" | "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const options: BsodWhereOptions = { omit: ["cmts", "node", "q"] };

  if (!bsodHasHealthFilter(filters, options)) {
    const { sql: whereSql, params } = buildBsodInventoryWhere(filters, options);
    const rows = await sirQuery<RowDataPacket[]>(
      `SELECT i.cmts AS value, COUNT(*) AS total
       ${BSOD_PME_FROM}
       ${appendWhereCondition(whereSql, "i.cmts IS NOT NULL AND TRIM(i.cmts) <> ''")}
       GROUP BY i.cmts
       ORDER BY i.cmts ASC`,
      params,
    );

    return rows.map((row) => ({
      value: String(row.value),
      total: Number(row.total),
    }));
  }

  const rows = await listMergedPmeRows(filters, options);
  return facetCountsFromRows(rows, "cmts");
}

/** Lista nodes distintos com contagem, opcionalmente restritos ao CMTS ativo. */
export async function listBsodNodes(
  filters: Omit<BsodFilters, "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const options: BsodWhereOptions = { omit: ["node", "q"] };

  if (!bsodHasHealthFilter(filters, options)) {
    const { sql: whereSql, params } = buildBsodInventoryWhere(filters, options);
    const rows = await sirQuery<RowDataPacket[]>(
      `SELECT i.node AS value, COUNT(*) AS total
       ${BSOD_PME_FROM}
       ${appendWhereCondition(whereSql, "i.node IS NOT NULL AND TRIM(i.node) <> ''")}
       GROUP BY i.node
       ORDER BY i.node ASC`,
      params,
    );

    return rows.map((row) => ({
      value: String(row.value),
      total: Number(row.total),
    }));
  }

  const rows = await listMergedPmeRows(filters, options);
  return facetCountsFromRows(rows, "node");
}

/** Chave estável para cache de agregados BSOD. */
function bsodCacheKey(prefix: string, filters: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(filters)}`;
}

/** Contagens de saúde com cache curto (toolbar). */
export function getCachedBsodHealthCounts(
  filters: Omit<BsodFilters, "health" | "limit" | "offset"> = {},
): Promise<BsodHealthCounts> {
  const key = bsodCacheKey("health", filters);
  return unstable_cache(async () => countBsodHealth(filters), [key], {
    revalidate: BSOD_CACHE_SEC,
  })();
}

/** Conta PME por VLAN BSOD respeitando filtros de saúde, CMTS e node. */
export async function countBsodVlan(
  filters: Omit<BsodFilters, "vlan" | "limit" | "offset"> = {},
): Promise<BsodVlanCounts> {
  if (!bsodHasHealthFilter(filters)) {
    const { sql: whereSql, params } = buildBsodInventoryWhere(filters, { omit: ["vlan", "q"] });
    const [row] = await sirQuery<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN i.bsod_vlan > 0 THEN 1 ELSE 0 END), 0) AS com_vlan
       ${BSOD_PME_FROM}
       ${whereSql}`,
      params,
    );

    const total = Number(row?.total ?? 0);
    const comVlan = Number(row?.com_vlan ?? 0);
    return {
      total,
      com_vlan: comVlan,
      sem_vlan: total - comVlan,
    };
  }

  const rows = await listMergedPmeRows(filters, { omit: ["vlan", "q"] });
  let comVlan = 0;
  for (const row of rows) {
    if ((row.bsod_vlan ?? 0) > 0) comVlan += 1;
  }
  return {
    total: rows.length,
    com_vlan: comVlan,
    sem_vlan: rows.length - comVlan,
  };
}

/** Contagens de VLAN com cache curto (toolbar). */
export function getCachedBsodVlanCounts(
  filters: Omit<BsodFilters, "vlan" | "limit" | "offset"> = {},
): Promise<BsodVlanCounts> {
  const key = bsodCacheKey("vlan", filters);
  return unstable_cache(async () => countBsodVlan(filters), [key], {
    revalidate: BSOD_CACHE_SEC,
  })();
}

/** Opções CMTS com cache curto (toolbar). */
export function getCachedBsodCmts(
  filters: Omit<BsodFilters, "cmts" | "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const key = bsodCacheKey("cmts", filters);
  return unstable_cache(async () => listBsodCmts(filters), [key], {
    revalidate: BSOD_CACHE_SEC,
  })();
}

/** Opções node com cache curto (toolbar). */
export function getCachedBsodNodes(
  filters: Omit<BsodFilters, "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const key = bsodCacheKey("nodes", filters);
  return unstable_cache(async () => listBsodNodes(filters), [key], {
    revalidate: BSOD_CACHE_SEC,
  })();
}

/** Retorna totais do inventário PME e saúde agregada do monitoramento. */
export async function bsodSummary() {
  const health = await countBsodHealth({});
  const vlan = await countBsodVlan({});
  const [cmts, nodes] = await Promise.all([listBsodCmts({}), listBsodNodes({})]);

  return {
    total: health.total,
    com_vlan: vlan.com_vlan,
    sem_vlan: vlan.sem_vlan,
    online: health.online,
    offline: health.offline,
    sem_leitura: health.sem_leitura,
    cmts: cmts.length,
    nodes: nodes.length,
  };
}

export type BsodSummary = Awaited<ReturnType<typeof bsodSummary>>;

/** Retorna totais BSOD com cache de curta duração (KPIs home). */
export const getCachedBsodSummary = unstable_cache(bsodSummary, ["bsod-summary"], {
  revalidate: BSOD_CACHE_SEC,
});
