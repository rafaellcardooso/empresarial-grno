import { BSOD_STATUS_LABELS } from "@/lib/config/metric-labels";
import type { RowDataPacket } from "mysql2";
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
    monitor_time:
      row.monitor_time instanceof Date
        ? row.monitor_time.toISOString()
        : row.monitor_time
          ? String(row.monitor_time)
          : null,
  };
}

/** Lista PME do inventário com última leitura de saúde (tbl_monitor_pme). */
export async function listPmeBsod(filters: BsodFilters = {}) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.health === "online") {
    where.push("m.status = 1");
  }
  if (filters.health === "offline") {
    where.push("m.status = 0");
  }
  if (filters.health === "sem_leitura") {
    where.push("m.status IS NULL");
  }
  if (filters.vlan === "com_vlan") {
    where.push("i.bsod_vlan > 0");
  }
  if (filters.vlan === "sem_vlan") {
    where.push("(i.bsod_vlan = 0 OR i.bsod_vlan IS NULL)");
  }
  if (filters.cmts) {
    where.push("i.cmts = ?");
    params.push(filters.cmts);
  }
  if (filters.node) {
    where.push("i.node = ?");
    params.push(filters.node);
  }
  if (filters.ope) {
    where.push("i.ope = ?");
    params.push(filters.ope);
  }

  const limit = Math.min(Math.max(filters.limit ?? 500, 1), 2000);
  const sql = `
    SELECT
      i.id, i.ope, i.cmts, i.mac, i.id_cable, i.node, i.contrato, i.profile,
      i.bsod_vlan, i.vlan,
      m.status AS monitor_status, m.tx, m.rx, m.mer, m.time AS monitor_time
    FROM tbl_inventory_pme i
    LEFT JOIN (${LATEST_MONITOR_SUBQUERY}) m
      ON UPPER(i.mac) = UPPER(m.mac) AND m.rn = 1
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE WHEN m.status = 0 THEN 0 WHEN m.status IS NULL THEN 1 ELSE 2 END,
      i.cmts, i.node, i.mac
    LIMIT ${limit}
  `;

  const rows = await hfcQuery<RowDataPacket[]>(sql, params);
  return serializeRows(rows.map(mapPmeRow));
}

/** Retorna totais do inventário PME e saúde agregada do monitoramento. */
export async function bsodSummary() {
  const [totals] = await hfcQuery<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN i.bsod_vlan > 0 THEN 1 ELSE 0 END) AS com_vlan,
       SUM(CASE WHEN m.status = 1 THEN 1 ELSE 0 END) AS online,
       SUM(CASE WHEN m.status = 0 THEN 1 ELSE 0 END) AS offline,
       SUM(CASE WHEN m.mac IS NULL THEN 1 ELSE 0 END) AS sem_leitura,
       COUNT(DISTINCT i.cmts) AS cmts,
       COUNT(DISTINCT i.node) AS nodes
     FROM tbl_inventory_pme i
     LEFT JOIN (${LATEST_MONITOR_SUBQUERY}) m
       ON UPPER(i.mac) = UPPER(m.mac) AND m.rn = 1`,
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
