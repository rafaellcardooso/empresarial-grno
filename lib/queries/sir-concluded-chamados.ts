import type { RowDataPacket } from "mysql2";
import { sirReportEndExclusive } from "@/lib/config/sir-report-filters";
import {
  SIR_CONCLUDED_MAX_PAGE_SIZE,
  SIR_CONCLUDED_PAGE_SIZE,
  sirConcludedOffset,
} from "@/lib/config/sir-report-pagination";
import { sirQuery } from "@/lib/db/sir";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import { SIR_TABLES } from "@/lib/models";
import type {
  SirConcludedChamadoRow,
  SirConcludedHistoryEntry,
  SirReportFilters,
  SirReportKpiScopeKey,
} from "@/lib/models/sir-report";
import { sirReportDddClause, sirReportPrefixClause } from "@/lib/queries/sir-report-scope";
import { parseValidacaoFcaMessage } from "@/lib/tratativa/validate-validacao-fca";

type ConcludedListRow = RowDataPacket & {
  tratativa_id: number;
  record_kind: "RAL" | "REC";
  record_key: string;
  cf_executante: string | null;
  classification: string | null;
  summary: string | null;
  details: string | null;
  abertura: string | null;
  message_text: string | null;
  concluded_at: Date | string;
  started_at: Date | string;
  user_name: string;
  user_corporate_id: string;
};

type HistoryRow = RowDataPacket & {
  tratativa_id: number;
  event_type: string;
  note: string | null;
  user_name: string;
  created_at: Date | string;
};

type CountRow = RowDataPacket & { total: number };

/** Lista chamados SIR concluídos no período, com FCA e cronologia. */
export async function listSirConcludedChamados(
  filters: SirReportFilters,
  pageInput?: number,
  pageSizeInput?: number,
  scope?: SirReportKpiScopeKey,
): Promise<{
  rows: SirConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(
    Math.max(pageSizeInput ?? SIR_CONCLUDED_PAGE_SIZE, 1),
    SIR_CONCLUDED_MAX_PAGE_SIZE,
  );
  const page = Math.max(pageInput ?? 1, 1);
  const offset = sirConcludedOffset(page, pageSize);
  const endExclusive = sirReportEndExclusive(filters);
  const kinds = scopeKinds(filters.domain, scope);
  const kindPlaceholders = kinds.map(() => "?").join(", ");
  const ddd = sirReportDddClause(filters.ddd);
  const prefix = scopePrefix(scope);
  const byPrefix = sirReportPrefixClause(prefix);
  const prefixSql = byPrefix.sql
    ? byPrefix.sql.replace(/num_recup/g, "COALESCE(ral.num_recup, rec.num_recup)")
    : "";

  const fromClause = `
    FROM app_tratativa_events e
    INNER JOIN app_tratativas t ON t.id = e.tratativa_id
    INNER JOIN app_users u ON u.id = COALESCE(e.user_id, t.user_id)
    LEFT JOIN ${SIR_TABLES.rals} ral
      ON e.record_kind = 'RAL'
     AND CONVERT(ral.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
         e.record_key COLLATE utf8mb4_unicode_ci
    LEFT JOIN ${SIR_TABLES.recs} rec
      ON e.record_kind = 'REC'
     AND CONVERT(rec.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
         e.record_key COLLATE utf8mb4_unicode_ci
    WHERE e.event_type = 'CONCLUIDA'
      AND e.record_kind IN (${kindPlaceholders})
      AND e.created_at >= ?
      AND e.created_at < ?
      ${dddSqlForJoined(ddd.sql)}
      ${prefixSql}
  `;

  const baseParams = [...kinds, filters.from, endExclusive, ...ddd.params, ...byPrefix.params];

  const [countRows, listRows] = await Promise.all([
    sirQuery<CountRow[]>(
      `SELECT COUNT(DISTINCT e.tratativa_id) AS total ${fromClause}`,
      baseParams,
    ),
    sirQuery<ConcludedListRow[]>(
      `SELECT e.tratativa_id, e.record_kind, e.record_key, e.message_text,
              e.created_at AS concluded_at, t.started_at,
              u.name AS user_name, u.corporate_id AS user_corporate_id,
              COALESCE(ral.cf_executante, rec.cf_executante) AS cf_executante,
              COALESCE(ral.abertura, rec.abertura) AS abertura,
              CASE
                WHEN e.record_kind = 'RAL' THEN
                  CASE WHEN ral.tipo_ral IS NULL OR TRIM(ral.tipo_ral) = '' THEN NULL
                       ELSE TRIM(ral.tipo_ral) END
                WHEN rec.num_recup LIKE 'DSR%' THEN 'DSR'
                WHEN rec.num_recup LIKE 'TCQ%' THEN 'TCQ'
                WHEN rec.num_recup LIKE 'REC%' THEN 'REC'
                ELSE 'Outros'
              END AS classification,
              CASE
                WHEN e.record_kind = 'RAL' THEN ral.descricao
                ELSE COALESCE(NULLIF(TRIM(rec.cliente), ''), NULLIF(TRIM(rec.designacao), ''))
              END AS summary,
              CASE
                WHEN e.record_kind = 'RAL' THEN ral.detalhes
                ELSE rec.detalhes_title
              END AS details
       ${fromClause}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, pageSize, offset],
    ),
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  if (listRows.length === 0) {
    return { rows: [], total, page, pageSize };
  }

  const ids = listRows.map((row) => row.tratativa_id);
  const historyById = await loadHistories(ids);

  const rows: SirConcludedChamadoRow[] = listRows.map((row) => ({
    id: row.tratativa_id,
    recordKind: row.record_kind,
    recordKey: row.record_key,
    cf: row.cf_executante,
    classification: row.classification,
    summary: row.summary,
    details: row.details,
    abertura: row.abertura,
    userName: row.user_name,
    userCorporateId: row.user_corporate_id,
    startedAt: normalizeDateTimeIso(row.started_at) ?? String(row.started_at),
    concludedAt: normalizeDateTimeIso(row.concluded_at) ?? String(row.concluded_at),
    fca: parseValidacaoFcaMessage(row.message_text),
    history: historyById.get(row.tratativa_id) ?? [],
  }));

  return { rows, total, page, pageSize };
}

/** Domínios incluídos conforme filtro do relatório e escopo opcional. */
function scopeKinds(
  domain: SirReportFilters["domain"],
  scope?: SirReportKpiScopeKey,
): Array<"RAL" | "REC"> {
  if (scope === "RAL") return ["RAL"];
  if (scope === "REC" || scope === "DSR" || scope === "TCQ") return ["REC"];
  if (domain === "ral") return ["RAL"];
  if (domain === "rec") return ["REC"];
  return ["RAL", "REC"];
}

/** Prefixo num_recup para filtrar REC/DSR/TCQ. */
function scopePrefix(scope?: SirReportKpiScopeKey): string | undefined {
  if (scope === "REC" || scope === "DSR" || scope === "TCQ") return scope;
  return undefined;
}

/**
 * Adapta cláusula de DDD (campo `cf_executante`) para o JOIN RAL/REC.
 * A cláusula original vem com prefixo ` AND `.
 */
function dddSqlForJoined(dddSql: string): string {
  if (!dddSql.trim()) return "";
  return dddSql.replace(/cf_executante/g, "COALESCE(ral.cf_executante, rec.cf_executante)");
}

/** Carrega cronologia completa das tratativas listadas. */
async function loadHistories(
  tratativaIds: number[],
): Promise<Map<number, SirConcludedHistoryEntry[]>> {
  const placeholders = tratativaIds.map(() => "?").join(", ");
  const rows = await sirQuery<HistoryRow[]>(
    `SELECT e.tratativa_id, e.event_type, e.note, e.created_at, u.name AS user_name
     FROM app_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.tratativa_id IN (${placeholders})
     ORDER BY e.tratativa_id ASC, e.created_at ASC, e.id ASC`,
    tratativaIds,
  );

  const map = new Map<number, SirConcludedHistoryEntry[]>();
  for (const row of rows) {
    const list = map.get(row.tratativa_id) ?? [];
    list.push({
      eventType: row.event_type,
      note: row.note,
      userName: row.user_name,
      createdAt: normalizeDateTimeIso(row.created_at) ?? String(row.created_at),
    });
    map.set(row.tratativa_id, list);
  }
  return map;
}
