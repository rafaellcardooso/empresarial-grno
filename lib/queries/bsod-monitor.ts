import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";

const BSOD_MONITOR_TTL_MS = 30_000;

export type LatestMonitorReading = {
  mac: string;
  status: number | null;
  tx: number | null;
  rx: number | null;
  mer: number | null;
  time: string | Date | null;
};

type MonitorCacheEntry = {
  expiresAt: number;
  promise: Promise<Map<string, LatestMonitorReading>>;
};

type BsodMonitorGlobal = typeof globalThis & {
  bsodLatestMonitor?: MonitorCacheEntry;
};

/**
 * Última leitura SNMP por MAC do inventário PME.
 * Escopo em `tbl_inventory_pme` evita full scan + window sobre todo o histórico.
 */
export const LATEST_MONITOR_FOR_INVENTORY_SQL = `
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
`;

/** Carrega mapa MAC → última leitura a partir do hfc-sls. */
async function fetchLatestMonitorByMac(): Promise<Map<string, LatestMonitorReading>> {
  const rows = await hfcQuery<RowDataPacket[]>(LATEST_MONITOR_FOR_INVENTORY_SQL);
  const byMac = new Map<string, LatestMonitorReading>();

  for (const row of rows) {
    const mac = String(row.mac);
    if (byMac.has(mac)) continue;
    byMac.set(mac, {
      mac,
      status: row.status == null ? null : Number(row.status),
      tx: row.tx == null ? null : Number(row.tx),
      rx: row.rx == null ? null : Number(row.rx),
      mer: row.mer == null ? null : Number(row.mer),
      time: (row.time as string | Date | null | undefined) ?? null,
    });
  }

  return byMac;
}

/**
 * Retorna última leitura por MAC com cache de processo (30s) e dedupe de in-flight.
 * Evita N full scans quando listagem, contagens e facets disparam em paralelo.
 */
export function getLatestMonitorByMac(): Promise<Map<string, LatestMonitorReading>> {
  const g = globalThis as BsodMonitorGlobal;
  const now = Date.now();
  const existing = g.bsodLatestMonitor;
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = fetchLatestMonitorByMac().catch((err) => {
    if (g.bsodLatestMonitor?.promise === promise) {
      g.bsodLatestMonitor = undefined;
    }
    throw err;
  });

  g.bsodLatestMonitor = {
    expiresAt: now + BSOD_MONITOR_TTL_MS,
    promise,
  };

  return promise;
}
