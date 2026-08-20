import type { RowDataPacket } from "mysql2";
import { sirQuery } from "@/lib/db/sir";

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
 * Última leitura RF por MAC (tabela materializada bsod_monitor_latest).
 * Evita GROUP BY no histórico bsod_monitor a cada request da UI.
 */
export const LATEST_MONITOR_FOR_INVENTORY_SQL = `
  SELECT m.mac, m.status, m.tx, m.rx, m.mer, m.sampled_at AS \`time\`
  FROM bsod_monitor_latest m
  INNER JOIN bsod_inventory i ON i.ope = m.ope AND i.mac = m.mac
`;

/** Carrega mapa MAC → última leitura a partir do SIR. */
async function fetchLatestMonitorByMac(): Promise<Map<string, LatestMonitorReading>> {
  const rows = await sirQuery<RowDataPacket[]>(LATEST_MONITOR_FOR_INVENTORY_SQL);
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
 * Retorna última leitura por MAC com cache de processo e dedupe de in-flight.
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
