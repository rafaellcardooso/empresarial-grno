import { bsodOperationLabel } from "@/lib/config/bsod-locations";
import { BSOD_STATUS_LABELS } from "@/lib/config/metric-labels";
import { likeContainsPattern, normalizeTableSearch } from "@/lib/config/table-search";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type { LatestMonitorReading } from "@/lib/queries/bsod-monitor";
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

/** FROM só de inventário — monitor é anexado em memória com cache de processo. */
export const BSOD_PME_FROM = `FROM tbl_inventory_pme i`;

/** Colunas de inventário PME (monitor anexado em memória). */
export const BSOD_INVENTORY_SELECT = `
  SELECT
    i.id, i.ope, i.cmts, i.mac, i.id_cable, i.node, i.contrato, i.profile,
    NULLIF(TRIM(i.address), '') AS address,
    i.bsod_vlan, i.vlan
`;

/** Alias legado usado por helpers que ainda esperam SELECT “joined”. */
export const BSOD_JOINED_SELECT = BSOD_INVENTORY_SELECT;

/** Monta WHERE só com filtros de inventário (saúde aplicada em memória). */
export function buildBsodInventoryWhere(
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

/** Alias compatível com o caminho antigo (sem predicados de monitor). */
export function buildBsodWhere(
  filters: BsodFilters = {},
  options?: BsodWhereOptions,
): {
  sql: string;
  params: unknown[];
} {
  return buildBsodInventoryWhere(filters, options);
}

/** Anexa condição extra a uma cláusula WHERE existente ou cria nova. */
export function appendWhereCondition(whereSql: string, condition: string): string {
  if (!whereSql) return `WHERE ${condition}`;
  return `${whereSql} AND ${condition}`;
}

/** Indica se o filtro de saúde está ativo para a consulta. */
export function bsodHasHealthFilter(filters: BsodFilters, options?: BsodWhereOptions): boolean {
  const omit = new Set(options?.omit ?? []);
  return !omit.has("health") && Boolean(filters.health);
}

/** Verifica se a linha atende ao filtro de saúde SNMP. */
export function matchesBsodHealth(
  monitorStatus: number | null,
  health: BsodHealthFilter | undefined,
): boolean {
  if (!health) return true;
  if (health === "online") return monitorStatus === 1;
  if (health === "offline") return monitorStatus === 0;
  return monitorStatus == null;
}

/** Rank de ordenação: offline → sem leitura → online. */
export function bsodHealthSortRank(monitorStatus: number | null): number {
  if (monitorStatus === 0) return 0;
  if (monitorStatus == null) return 1;
  return 2;
}

/** Compara linhas BSOD na ordem padrão da listagem. */
export function compareBsodRows(a: PmeBsodRow, b: PmeBsodRow): number {
  const healthDiff = bsodHealthSortRank(a.monitor_status) - bsodHealthSortRank(b.monitor_status);
  if (healthDiff !== 0) return healthDiff;
  const cmtsDiff = a.cmts.localeCompare(b.cmts);
  if (cmtsDiff !== 0) return cmtsDiff;
  const nodeDiff = a.node.localeCompare(b.node);
  if (nodeDiff !== 0) return nodeDiff;
  return a.mac.localeCompare(b.mac);
}

/** Converte código de status SNMP em rótulo de saúde. */
function monitorStatusLabel(status: number | null | undefined): string {
  if (status === 1) return BSOD_STATUS_LABELS.online;
  if (status === 0) return BSOD_STATUS_LABELS.offline;
  return BSOD_STATUS_LABELS.semLeitura;
}

/** Une linha de inventário com a última leitura SNMP (se houver). */
export function mergeInventoryWithMonitor(
  inventoryRow: RowDataPacket,
  reading: LatestMonitorReading | undefined,
): RowDataPacket {
  return {
    ...inventoryRow,
    monitor_status: reading?.status ?? null,
    tx: reading?.tx ?? null,
    rx: reading?.rx ?? null,
    mer: reading?.mer ?? null,
    monitor_time: reading?.time ?? null,
  };
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
