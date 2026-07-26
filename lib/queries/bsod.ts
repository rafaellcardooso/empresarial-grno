import { BSOD_STATUS_LABELS } from "@/lib/config/metric-labels";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";
import { hfcQuery } from "@/lib/db/hfc";
import { serializeRows } from "@/lib/serialize";

export type PmeBsodRow = RowDataPacket & {
  id: number;
  ope: string;
  cmts: string;
  mac: string;
  id_cable: string;
  node: string;
  contrato: string;
  profile: string;
  bsod_vlan: number | null;
  vlan: string;
  monitor_status: number | null;
  monitor_label: string;
  tx: number | null;
  rx: number | null;
  mer: number | null;
  monitor_time: string | null;
};

export type BsodHealthFilter = "online" | "offline" | "sem_leitura";
export type BsodVlanFilter = "com_vlan" | "sem_vlan";

export type BsodFilters = {
  cmts?: string;
  node?: string;
  ope?: string;
  health?: BsodHealthFilter;
  vlan?: BsodVlanFilter;
  limit?: number;
};

const LATEST_MONITOR_SUBQUERY = `
  SELECT mac, status, tx, rx, mer, time,
    ROW_NUMBER() OVER (PARTITION BY UPPER(mac) ORDER BY time DESC) AS rn
  FROM tbl_monitor_pme
`;

const BSOD_FROM_JOIN = `
  FROM tbl_inventory_pme i
  LEFT JOIN (${LATEST_MONITOR_SUBQUERY}) m
    ON UPPER(i.mac) = UPPER(m.mac) AND m.rn = 1
`;

type BsodWhereOptions = {
  omit?: Array<"health" | "cmts" | "node" | "vlan" | "ope">;
};

/** Monta cláusulas WHERE compartilhadas das consultas BSOD. */
function buildBsodWhere(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): {
  sql: string;
  params: unknown[];
} {
  const omit = new Set(options?.omit ?? []);
  const where: string[] = [];
  const params: unknown[] = [];

  if (!omit.has("health") && filters.health === "online") {
    where.push("m.status = 1");
  }
  if (!omit.has("health") && filters.health === "offline") {
    where.push("m.status = 0");
  }
  if (!omit.has("health") && filters.health === "sem_leitura") {
    where.push("m.status IS NULL");
  }
  if (!omit.has("vlan") && filters.vlan === "com_vlan") {
    where.push("i.bsod_vlan > 0");
  }
  if (!omit.has("vlan") && filters.vlan === "sem_vlan") {
    where.push("(i.bsod_vlan = 0 OR i.bsod_vlan IS NULL)");
  }
  if (!omit.has("cmts") && filters.cmts) {
    where.push("i.cmts = ?");
    params.push(filters.cmts);
  }
  if (!omit.has("node") && filters.node) {
    where.push("i.node = ?");
    params.push(filters.node);
  }
  if (!omit.has("ope") && filters.ope) {
    where.push("i.ope = ?");
    params.push(filters.ope);
  }

  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

/** Anexa condição extra a uma cláusula WHERE existente ou cria nova. */
function appendWhereCondition(whereSql: string, condition: string): string {
  if (!whereSql) return `WHERE ${condition}`;
  return `${whereSql} AND ${condition}`;
}

export type BsodFacetCount = {
  value: string;
  total: number;
};

export type BsodHealthCounts = {
  total: number;
  online: number;
  offline: number;
  sem_leitura: number;
};

/** Converte código de status SNMP em rótulo de saúde. */
function monitorStatusLabel(status: number | null | undefined): string {
  if (status === 1) return BSOD_STATUS_LABELS.online;
  if (status === 0) return BSOD_STATUS_LABELS.offline;
  return BSOD_STATUS_LABELS.semLeitura;
}

/** Normaliza linha unindo inventário PME com última leitura de monitoramento. */
function mapPmeRow(row: RowDataPacket): PmeBsodRow {
  const bsodVlan = Number(row.bsod_vlan);
  return {
    ...(row as PmeBsodRow),
    bsod_vlan: bsodVlan > 0 ? bsodVlan : null,
    monitor_status: row.monitor_status == null ? null : Number(row.monitor_status),
    monitor_label: monitorStatusLabel(
      row.monitor_status == null ? null : Number(row.monitor_status),
    ),
    tx: row.tx == null ? null : Number(row.tx),
    rx: row.rx == null ? null : Number(row.rx),
    mer: row.mer == null ? null : Number(row.mer),
    monitor_time: normalizeDateTimeIso(row.monitor_time as string | Date | null | undefined),
  };
}

/** Lista PME do inventário com offline primeiro, depois CMTS, node e MAC. */
export async function listPmeBsod(filters: BsodFilters = {}) {
  const { sql: whereSql, params } = buildBsodWhere(filters);
  const limit = Math.min(Math.max(filters.limit ?? 500, 1), 2000);
  const sql = `
    SELECT
      i.id, i.ope, i.cmts, i.mac, i.id_cable, i.node, i.contrato, i.profile,
      i.bsod_vlan, i.vlan,
      m.status AS monitor_status, m.tx, m.rx, m.mer, m.time AS monitor_time
    ${BSOD_FROM_JOIN}
    ${whereSql}
    ORDER BY
      CASE WHEN m.status = 0 THEN 0 WHEN m.status IS NULL THEN 1 ELSE 2 END,
      i.cmts ASC, i.node ASC, i.mac ASC
    LIMIT ${limit}
  `;

  const rows = await hfcQuery<RowDataPacket[]>(sql, params);
  return serializeRows(rows.map(mapPmeRow));
}

/** Conta PME por saúde respeitando filtros de CMTS, node e VLAN. */
export async function countBsodHealth(
  filters: Omit<BsodFilters, "health" | "limit"> = {},
): Promise<BsodHealthCounts> {
  const { sql: whereSql, params } = buildBsodWhere(filters, { omit: ["health"] });
  const [row] = await hfcQuery<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN m.status = 1 THEN 1 ELSE 0 END) AS online,
       SUM(CASE WHEN m.status = 0 THEN 1 ELSE 0 END) AS offline,
       SUM(CASE WHEN m.status IS NULL THEN 1 ELSE 0 END) AS sem_leitura
     ${BSOD_FROM_JOIN}
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
  filters: Omit<BsodFilters, "cmts" | "node" | "limit"> = {},
): Promise<BsodFacetCount[]> {
  const { sql: whereSql, params } = buildBsodWhere(filters, { omit: ["cmts", "node"] });
  const rows = await hfcQuery<RowDataPacket[]>(
    `SELECT i.cmts AS value, COUNT(*) AS total
     ${BSOD_FROM_JOIN}
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
  filters: Omit<BsodFilters, "node" | "limit"> = {},
): Promise<BsodFacetCount[]> {
  const { sql: whereSql, params } = buildBsodWhere(filters, { omit: ["node"] });
  const rows = await hfcQuery<RowDataPacket[]>(
    `SELECT i.node AS value, COUNT(*) AS total
     ${BSOD_FROM_JOIN}
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

/** Retorna totais do inventário PME e saúde agregada do monitoramento. */
export async function bsodSummary() {
  const [totals] = await hfcQuery<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN i.bsod_vlan > 0 THEN 1 ELSE 0 END) AS com_vlan,
       SUM(CASE WHEN m.status = 1 THEN 1 ELSE 0 END) AS online,
       SUM(CASE WHEN m.status = 0 THEN 1 ELSE 0 END) AS offline,
       SUM(CASE WHEN m.status IS NULL THEN 1 ELSE 0 END) AS sem_leitura,
       COUNT(DISTINCT i.cmts) AS cmts,
       COUNT(DISTINCT i.node) AS nodes
     ${BSOD_FROM_JOIN}`,
  );

  const total = Number(totals?.total ?? 0);
  const comVlan = Number(totals?.com_vlan ?? 0);

  return {
    total,
    com_vlan: comVlan,
    sem_vlan: total - comVlan,
    online: Number(totals?.online ?? 0),
    offline: Number(totals?.offline ?? 0),
    sem_leitura: Number(totals?.sem_leitura ?? 0),
    cmts: Number(totals?.cmts ?? 0),
    nodes: Number(totals?.nodes ?? 0),
  };
}

export type BsodSummary = Awaited<ReturnType<typeof bsodSummary>>;

const BSOD_SUMMARY_REVALIDATE_SEC = 30;

/** Retorna totais BSOD com cache de curta duração (KPIs não mudam por filtro). */
export const getCachedBsodSummary = unstable_cache(bsodSummary, ["bsod-summary"], {
  revalidate: BSOD_SUMMARY_REVALIDATE_SEC,
});

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
