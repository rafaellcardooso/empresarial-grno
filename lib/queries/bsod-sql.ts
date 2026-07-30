import { bsodOperationLabel } from "@/lib/config/bsod-locations";
import { BSOD_STATUS_LABELS } from "@/lib/config/metric-labels";
import { likeContainsPattern, normalizeTableSearch } from "@/lib/config/table-search";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type { RowDataPacket } from "mysql2";

export type PmeBsodRow = RowDataPacket & {
  id: number;
  ope: string;
  ope_label: string;
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
export type BsodListScope = "alarms" | "inventory";

export type BsodFilters = {
  cmts?: string;
  node?: string;
  ope?: string;
  /** Restringe a um conjunto de operações (ex.: DDD 98 → `sls`). */
  opes?: string[];
  health?: BsodHealthFilter;
  vlan?: BsodVlanFilter;
  q?: string;
  macs?: string[];
  /** Exclui MACs (ex.: pendentes = offline sem tratativa ativa). */
  excludeMacs?: string[];
  scope?: BsodListScope;
  limit?: number;
  offset?: number;
};

export type BsodWhereOptions = {
  omit?: Array<"health" | "cmts" | "node" | "vlan" | "ope" | "q">;
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

export type BsodVlanCounts = {
  total: number;
  com_vlan: number;
  sem_vlan: number;
};

/** JOIN inventário + última leitura SNMP por MAC (desempate determinístico). */
export const BSOD_PME_FROM = `
FROM tbl_inventory_pme i
LEFT JOIN (
  SELECT mac, status, tx, rx, mer, \`time\`
  FROM (
    SELECT
      m.mac, m.status, m.tx, m.rx, m.mer, m.\`time\`,
      ROW_NUMBER() OVER (
        PARTITION BY m.mac
        ORDER BY m.\`time\` DESC,
                 IFNULL(m.status, -1) DESC,
                 IFNULL(m.tx, -9999) DESC,
                 IFNULL(m.rx, -9999) DESC,
                 IFNULL(m.mer, -9999) DESC
      ) AS rn
    FROM tbl_monitor_pme m
    WHERE m.mac IN (SELECT mac FROM tbl_inventory_pme)
  ) ranked
  WHERE rn = 1
) mon ON mon.mac = i.mac
`;

/** Colunas unidas de inventário e monitoramento. */
export const BSOD_JOINED_SELECT = `
  SELECT
    i.id, i.ope, i.cmts, i.mac, i.id_cable, i.node, i.contrato, i.profile,
    NULLIF(TRIM(i.address), '') AS address,
    i.bsod_vlan, i.vlan,
    mon.status AS monitor_status,
    mon.tx, mon.rx, mon.mer,
    mon.time AS monitor_time
`;

/** Monta WHERE com inventário, operações, saúde SNMP e busca. */
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
  if (!omit.has("ope") && filters.opes && filters.opes.length > 0) {
    const placeholders = filters.opes.map(() => "?").join(", ");
    where.push(`i.ope IN (${placeholders})`);
    params.push(...filters.opes);
  }

  if (filters.macs && filters.macs.length > 0) {
    const placeholders = filters.macs.map(() => "?").join(", ");
    where.push(`UPPER(i.mac) IN (${placeholders})`);
    params.push(...filters.macs.map((mac) => mac.toUpperCase()));
  }
  if (filters.excludeMacs && filters.excludeMacs.length > 0) {
    const placeholders = filters.excludeMacs.map(() => "?").join(", ");
    where.push(`UPPER(i.mac) NOT IN (${placeholders})`);
    params.push(...filters.excludeMacs.map((mac) => mac.toUpperCase()));
  }

  if (!omit.has("health") && filters.health === "online") {
    where.push("mon.status = 1");
  }
  if (!omit.has("health") && filters.health === "offline") {
    where.push("mon.status = 0");
  }
  if (!omit.has("health") && filters.health === "sem_leitura") {
    where.push("mon.status IS NULL");
  }

  if (!omit.has("q")) {
    const term = normalizeTableSearch(filters.q);
    if (term) {
      const pattern = likeContainsPattern(term);
      where.push(`(
        i.mac LIKE ? ESCAPE '!'
        OR i.contrato LIKE ? ESCAPE '!'
        OR i.node LIKE ? ESCAPE '!'
        OR i.cmts LIKE ? ESCAPE '!'
        OR i.ope LIKE ? ESCAPE '!'
        OR i.address LIKE ? ESCAPE '!'
        OR i.id_cable LIKE ? ESCAPE '!'
        OR i.profile LIKE ? ESCAPE '!'
        OR i.vlan LIKE ? ESCAPE '!'
      )`);
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }
  }

  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

/** Anexa condição extra a uma cláusula WHERE existente ou cria nova. */
export function appendWhereCondition(whereSql: string, condition: string): string {
  if (!whereSql) return `WHERE ${condition}`;
  return `${whereSql} AND ${condition}`;
}

/** Expressão SQL do rank de saúde para ORDER BY. */
export const BSOD_HEALTH_SORT_SQL = `
  CASE
    WHEN mon.status = 0 THEN 0
    WHEN mon.status IS NULL THEN 1
    ELSE 2
  END
`;

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
  const ope = String(row.ope ?? "");
  return {
    ...(row as PmeBsodRow),
    ope,
    ope_label: bsodOperationLabel(ope),
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
