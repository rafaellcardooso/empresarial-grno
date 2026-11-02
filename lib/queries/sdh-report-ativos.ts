import type { RowDataPacket } from "mysql2";
import {
  SDH_DDD_EMPTY,
  SDH_VENDOR_LABELS,
  sdhDddSql,
  sdhStatusSql,
  sdhVendorSql,
} from "@/lib/config/sdh-filters";
import { sdhVendorFromRankKey } from "@/lib/config/sdh-report-drilldown";
import {
  SDH_CONCLUDED_MAX_PAGE_SIZE,
  SDH_CONCLUDED_PAGE_SIZE,
} from "@/lib/config/sdh-report-pagination";
import { sirQuery } from "@/lib/db/sir";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type {
  SdhReportAtivoRow,
  SdhReportAtivosDim,
  SdhReportAtivosFilters,
} from "@/lib/models/sdh-report-ativos";

type ListRow = RowDataPacket & {
  id: number;
  ne: string | null;
  alarme: string | null;
  ddd: string | null;
  municipio: string | null;
  gerencia: string | null;
  porta: string | null;
  circuito: string | null;
  data_alarme: Date | string | null;
  em_tratativa: number;
  tratativa_user_login: string | null;
};

type CountRow = RowDataPacket & { total: number };

/** Normaliza pageSize do drill-down SDH. */
export function sdhReportAtivosPageSize(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return SDH_CONCLUDED_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(raw), 1), SDH_CONCLUDED_MAX_PAGE_SIZE);
}

/** Monta cláusula extra da dimensão clicada. */
function dimClause(dim: SdhReportAtivosDim, key: string): { clause: string; params: string[] } {
  if (dim === "ddd") {
    return sdhDddSql(key || SDH_DDD_EMPTY);
  }

  if (dim === "vendor") {
    const vendor = sdhVendorFromRankKey(key);
    if (!vendor) return { clause: " AND 1 = 0", params: [] };
    return sdhVendorSql(vendor);
  }

  if (dim === "municipio") {
    if (key === "Sem município") {
      return {
        clause: " AND (a.municipio IS NULL OR TRIM(a.municipio) = '')",
        params: [],
      };
    }
    return { clause: " AND UPPER(TRIM(a.municipio)) = ?", params: [key.toUpperCase()] };
  }

  if (key === "Sem alarme") {
    return {
      clause: " AND (a.alarme IS NULL OR TRIM(a.alarme) = '')",
      params: [],
    };
  }
  return { clause: " AND TRIM(a.alarme) = ?", params: [key] };
}

/** Lista alarmes SDH ativos filtrados pela fatia do ranking. */
export async function listSdhReportAtivos(
  filters: SdhReportAtivosFilters,
): Promise<{ rows: SdhReportAtivoRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = sdhReportAtivosPageSize(filters.pageSize);
  const page = Math.max(1, Math.floor(filters.page || 1));
  const offset = (page - 1) * pageSize;

  const reportVendor = sdhVendorSql(filters.vendor);
  const reportDdd = sdhDddSql(filters.ddd);
  const status = sdhStatusSql(filters.status);
  const dim = dimClause(filters.dim, filters.key);

  // Quando a dimensão é vendor/ddd, a fatia já aplica o escopo — evita AND duplicado conflitante.
  const scopeVendor =
    filters.dim === "vendor" ? { clause: "", params: [] as string[] } : reportVendor;
  const scopeDdd = filters.dim === "ddd" ? { clause: "", params: [] as string[] } : reportDdd;

  const whereSql = `
    FROM sdh_alarms a
    LEFT JOIN app_users u ON u.id = a.tratativa_user_id
    WHERE a.is_active = 1
      ${scopeVendor.clause}
      ${scopeDdd.clause}
      ${status.clause}
      ${dim.clause}
  `;
  const params = [...scopeVendor.params, ...scopeDdd.params, ...status.params, ...dim.params];

  const [countRows, listRows] = await Promise.all([
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS total ${whereSql}`, params),
    sirQuery<ListRow[]>(
      `SELECT a.id, a.ne, a.alarme, a.ddd, a.municipio, a.gerencia, a.porta, a.circuito,
              a.data_alarme, a.em_tratativa, u.corporate_id AS tratativa_user_login
       ${whereSql}
       ORDER BY
         CASE WHEN a.data_alarme IS NULL THEN 1 ELSE 0 END,
         a.data_alarme DESC,
         a.id DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    ),
  ]);

  return {
    total: Number(countRows[0]?.total ?? 0),
    page,
    pageSize,
    rows: listRows.map((row) => ({
      id: Number(row.id),
      ne: row.ne?.trim() || null,
      alarme: row.alarme?.trim() || null,
      ddd: row.ddd?.trim() || null,
      municipio: row.municipio?.trim() || null,
      vendor: vendorLabel(row.gerencia),
      porta: row.porta?.trim() || null,
      circuito: row.circuito?.trim() || null,
      dataAlarme: normalizeDateTimeIso(row.data_alarme),
      treatment: Number(row.em_tratativa) === 1 ? "em-tratativa" : "pendente",
      tratativaUserLogin: row.tratativa_user_login?.trim() || null,
    })),
  };
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
