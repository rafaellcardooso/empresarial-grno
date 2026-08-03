import type { RowDataPacket } from "mysql2";
import { hfcQuery } from "@/lib/db/hfc";

const BSOD_MONITOR_TTL_MS = 60_000;

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
 * Escopo em inventário + janela de 30 dias evita full scan de ~650k linhas.
 */
export const LATEST_MONITOR_FOR_INVENTORY_SQL = `
  SELECT m.mac, m.status, m.tx, m.rx, m.mer, m.\`time\`
  FROM tbl_monitor_pme m
  INNER JOIN (
    SELECT mac, MAX(\`time\`) AS max_time
    FROM tbl_monitor_pme
    WHERE mac IN (SELECT mac FROM tbl_inventory_pme)
      AND \`time\` >= (NOW() - INTERVAL 30 DAY)
    GROUP BY mac
  ) latest ON m.mac = latest.mac AND m.\`time\` = latest.max_time
`;

/** Carrega mapa MAC → última leitura a partir do hfc-sls. */
async function fetchLatestMonitorByMac(): Promise<Map<string, LatestMonitorReading>> {
  const rows = await hfcQuery<RowDataPacket[]>(LATEST_MONITOR_FOR_INVENTORY_SQL);
  const byMac = new Map<string, LatestMonitorReading>();

  for (const row of rows) {
    const mac = String(row.mac);
    const reading: LatestMonitorReading = {
      mac,
      status: row.status == null ? null : Number(row.status),
      tx: row.tx == null ? null : Number(row.tx),
      rx: row.rx == null ? null : Number(row.rx),
      mer: row.mer == null ? null : Number(row.mer),
      time: (row.time as string | Date | null | undefined) ?? null,
    };
    if (!byMac.has(mac)) byMac.set(mac, reading);
    const upper = mac.toUpperCase();
    if (!byMac.has(upper)) byMac.set(upper, reading);
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
