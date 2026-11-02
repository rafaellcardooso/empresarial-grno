import type { RowDataPacket } from "mysql2";
import { SDH_VENDOR_LABELS, sdhDddSql, sdhVendorSql } from "@/lib/config/sdh-filters";
import { sdhReportEndExclusive } from "@/lib/config/sdh-report-filters";
import {
  SDH_CONCLUDED_MAX_PAGE_SIZE,
  SDH_CONCLUDED_PAGE_SIZE,
  sdhConcludedOffset,
} from "@/lib/config/sdh-report-pagination";
import { sirQuery } from "@/lib/db/sir";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type {
  SdhConcludedChamadoRow,
  SdhConcludedHistoryEntry,
  SdhReportFilters,
} from "@/lib/models/sdh-report";
import { parseValidacaoFcaMessage } from "@/lib/tratativa/validate-validacao-fca";

type CloseListRow = RowDataPacket & {
  event_id: number;
  alarm_id: number;
  ne: string | null;
  alarme: string | null;
  ddd: string | null;
  municipio: string | null;
  gerencia: string | null;
  porta: string | null;
  circuito: string | null;
  data_alarme: Date | string | null;
  observacao: string | null;
  concluded_at: Date | string;
  user_name: string;
  user_corporate_id: string;
};

type HistoryRow = RowDataPacket & {
  alarm_id: number;
  event_type: string;
  observacao: string | null;
  user_name: string;
  created_at: Date | string;
};

type CountRow = RowDataPacket & { total: number };

/** Escopo vendor/DDD sobre alias `a` (sdh_alarms). */
function scopeSql(filters: SdhReportFilters): { clause: string; params: string[] } {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  return {
    clause: `${vendor.clause} ${ddd.clause}`,
    params: [...vendor.params, ...ddd.params],
  };
}

/** Lista encerramentos SDH (CLOSE) no período, com FCA e cronologia. */
export async function listSdhConcludedChamados(
  filters: SdhReportFilters,
  pageInput?: number,
  pageSizeInput?: number,
): Promise<{
  rows: SdhConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(
    Math.max(pageSizeInput ?? SDH_CONCLUDED_PAGE_SIZE, 1),
    SDH_CONCLUDED_MAX_PAGE_SIZE,
  );
  const page = Math.max(pageInput ?? 1, 1);
  const offset = sdhConcludedOffset(page, pageSize);
  const endExclusive = sdhReportEndExclusive(filters);
  const scope = scopeSql(filters);

  const fromClause = `
    FROM sdh_tratativa_events e
    INNER JOIN sdh_alarms a ON a.id = e.alarm_id
    INNER JOIN app_users u ON u.id = e.user_id
    WHERE e.event_type = 'CLOSE'
      AND e.created_at >= ?
      AND e.created_at < ?
      ${scope.clause}
  `;
  const baseParams = [filters.from, endExclusive, ...scope.params];

  const [countRows, listRows] = await Promise.all([
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS total ${fromClause}`, baseParams),
    sirQuery<CloseListRow[]>(
      `SELECT e.id AS event_id, e.alarm_id, a.ne, a.alarme, a.ddd, a.municipio,
              a.gerencia, a.porta, a.circuito, a.data_alarme,
              e.observacao, e.created_at AS concluded_at,
              u.name AS user_name, u.corporate_id AS user_corporate_id
       ${fromClause}
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, pageSize, offset],
    ),
  ]);

  const alarmIds = [...new Set(listRows.map((row) => Number(row.alarm_id)))];
  const historyByAlarm = await loadHistoryByAlarm(alarmIds);

  const rows: SdhConcludedChamadoRow[] = listRows.map((row) => {
    const history = historyByAlarm.get(Number(row.alarm_id)) ?? [];
    const started = history.find((entry) => entry.eventType === "START");
    return {
      id: Number(row.event_id),
      alarmId: Number(row.alarm_id),
      ne: row.ne?.trim() || null,
      alarme: row.alarme?.trim() || null,
      ddd: row.ddd?.trim() || null,
      municipio: row.municipio?.trim() || null,
      vendor: vendorLabel(row.gerencia),
      porta: row.porta?.trim() || null,
      circuito: row.circuito?.trim() || null,
      dataAlarme: normalizeDateTimeIso(row.data_alarme),
      userName: row.user_name,
      userCorporateId: row.user_corporate_id,
      startedAt: started?.createdAt ?? null,
      concludedAt: normalizeDateTimeIso(row.concluded_at) ?? String(row.concluded_at),
      fca: parseValidacaoFcaMessage(row.observacao),
      history,
    };
  });

  return {
    rows,
    total: Number(countRows[0]?.total ?? 0),
    page,
    pageSize,
  };
}

/** Carrega cronologia completa dos alarmes listados. */
async function loadHistoryByAlarm(
  alarmIds: number[],
): Promise<Map<number, SdhConcludedHistoryEntry[]>> {
  const map = new Map<number, SdhConcludedHistoryEntry[]>();
  if (alarmIds.length === 0) return map;

  const placeholders = alarmIds.map(() => "?").join(", ");
  const rows = await sirQuery<HistoryRow[]>(
    `SELECT e.alarm_id, e.event_type, e.observacao, e.created_at, u.name AS user_name
     FROM sdh_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.alarm_id IN (${placeholders})
     ORDER BY e.alarm_id ASC, e.created_at ASC, e.id ASC`,
    alarmIds,
  );

  for (const row of rows) {
    const list = map.get(Number(row.alarm_id)) ?? [];
    list.push({
      eventType: row.event_type,
      note: row.observacao,
      userName: row.user_name,
      createdAt: normalizeDateTimeIso(row.created_at) ?? String(row.created_at),
    });
    map.set(Number(row.alarm_id), list);
  }
  return map;
}

/** Rótulo de gerência a partir do campo bruto. */
function vendorLabel(gerencia: string | null): string | null {
  const raw = gerencia?.trim().toLowerCase() ?? "";
  if (!raw) return null;
  if (raw === "datacom") return SDH_VENDOR_LABELS.datacom;
  if (raw.includes("tellabs")) return SDH_VENDOR_LABELS.tellabs;
  if (raw.includes("alcatel") || raw.includes("nokia")) return SDH_VENDOR_LABELS.alcatel;
  return gerencia?.trim() || null;
}
