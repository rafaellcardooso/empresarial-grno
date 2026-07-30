import type { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";
import { hfcQuery } from "@/lib/db/hfc";
import {
  appendWhereCondition,
  BSOD_PME_FROM,
  buildBsodWhere,
  type BsodFacetCount,
  type BsodFilters,
  type BsodHealthCounts,
  type BsodVlanCounts,
  type BsodWhereOptions,
} from "@/lib/queries/bsod-sql";

const BSOD_CACHE_SEC = 30;

/** Conta PME por saúde respeitando filtros de CMTS, node e VLAN. */
export async function countBsodHealth(
  filters: Omit<BsodFilters, "health" | "limit" | "offset"> = {},
): Promise<BsodHealthCounts> {
  const { sql: whereSql, params } = buildBsodWhere(filters, { omit: ["health", "q"] });
  const [row] = await hfcQuery<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN mon.status = 1 THEN 1 ELSE 0 END), 0) AS online,
       COALESCE(SUM(CASE WHEN mon.status = 0 THEN 1 ELSE 0 END), 0) AS offline,
       COALESCE(SUM(CASE WHEN mon.status IS NULL THEN 1 ELSE 0 END), 0) AS sem_leitura
     ${BSOD_PME_FROM}
     ${whereSql}`,
    params,
  );

  return {
    total: Number(row?.total ?? 0),
    online: Number(row?.online ?? 0),
    offline: Number(row?.offline ?? 0),
    sem_leitura: Number(row?.sem_leitura ?? 0),
  };
}

/** Lista CMTS distintos com contagem, respeitando filtros exceto CMTS/node. */
export async function listBsodCmts(
  filters: Omit<BsodFilters, "cmts" | "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const options: BsodWhereOptions = { omit: ["cmts", "node", "q"] };
  const { sql: whereSql, params } = buildBsodWhere(filters, options);
  const rows = await hfcQuery<RowDataPacket[]>(
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

/** Lista nodes distintos com contagem, opcionalmente restritos ao CMTS ativo. */
export async function listBsodNodes(
  filters: Omit<BsodFilters, "node" | "limit" | "offset"> = {},
): Promise<BsodFacetCount[]> {
  const options: BsodWhereOptions = { omit: ["node", "q"] };
  const { sql: whereSql, params } = buildBsodWhere(filters, options);
  const rows = await hfcQuery<RowDataPacket[]>(
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
  const { sql: whereSql, params } = buildBsodWhere(filters, { omit: ["vlan", "q"] });
  const [row] = await hfcQuery<RowDataPacket[]>(
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
