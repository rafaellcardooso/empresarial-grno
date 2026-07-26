import { BSOD_STATUS_LABELS } from "@/lib/config/metric-labels";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type { RowDataPacket } from "mysql2";

export type PmeBsodRow = RowDataPacket & {
  id: number;
  ope: string;
  cmts: string;
  mac: string;
  id_cable: string;
  node: string;
  contrato: string;
  profile: string;
  address: string | null;
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
  offset?: number;
};

export type BsodWhereOptions = {
  omit?: Array<"health" | "cmts" | "node" | "vlan" | "ope">;
};

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

/** Subquery com última leitura por MAC (evita JOIN com tbl_inventory_cables). */
export const LATEST_MONITOR_SUBQUERY = `
  SELECT mac, status, tx, rx, mer, time
  FROM (
    SELECT mac, status, tx, rx, mer, time,
      ROW_NUMBER() OVER (PARTITION BY mac ORDER BY time DESC) AS rn
    FROM tbl_monitor_pme
  ) ranked
  WHERE rn = 1
`;

export const BSOD_PME_FROM = `FROM tbl_inventory_pme i`;

export const BSOD_FROM_WITH_MONITOR = `
  ${BSOD_PME_FROM}
  LEFT JOIN (${LATEST_MONITOR_SUBQUERY}) m ON i.mac = m.mac
`;

export const BSOD_LIST_SELECT = `
  SELECT
    i.id, i.ope, i.cmts, i.mac, i.id_cable, i.node, i.contrato, i.profile,
    NULLIF(TRIM(i.address), '') AS address,
    i.bsod_vlan, i.vlan,
    m.status AS monitor_status, m.tx, m.rx, m.mer, m.time AS monitor_time
`;

/** Indica se filtros exigem JOIN com monitoramento. */
export function bsodNeedsMonitorJoin(filters: BsodFilters, options?: BsodWhereOptions): boolean {
  const omit = new Set(options?.omit ?? []);
  if (!omit.has("health") && filters.health) return true;
  return false;
}

/** Monta cláusulas WHERE compartilhadas das consultas BSOD. */
export function buildBsodWhere(
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

/** Escolhe FROM com ou sem monitor conforme filtros da consulta. */
export function bsodFromClause(filters: BsodFilters, options?: BsodWhereOptions): string {
  return bsodNeedsMonitorJoin(filters, options) ? BSOD_FROM_WITH_MONITOR : BSOD_PME_FROM;
}

/** Anexa condição extra a uma cláusula WHERE existente ou cria nova. */
export function appendWhereCondition(whereSql: string, condition: string): string {
  if (!whereSql) return `WHERE ${condition}`;
  return `${whereSql} AND ${condition}`;
}

/** Converte código de status SNMP em rótulo de saúde. */
function monitorStatusLabel(status: number | null | undefined): string {
  if (status === 1) return BSOD_STATUS_LABELS.online;
  if (status === 0) return BSOD_STATUS_LABELS.offline;
  return BSOD_STATUS_LABELS.semLeitura;
}

/** Normaliza linha unindo inventário PME com última leitura de monitoramento. */
export function mapPmeRow(row: RowDataPacket): PmeBsodRow {
  const bsodVlan = Number(row.bsod_vlan);
  const addressRaw = row.address == null ? null : String(row.address).trim();
  return {
    ...(row as PmeBsodRow),
    address: addressRaw || null,
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
