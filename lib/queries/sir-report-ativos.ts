import type { RowDataPacket } from "mysql2";
import {
  SIR_CONCLUDED_MAX_PAGE_SIZE,
  SIR_CONCLUDED_PAGE_SIZE,
} from "@/lib/config/sir-report-pagination";
import { sirQuery } from "@/lib/db/sir";
import { SIR_TABLES } from "@/lib/models";
import type {
  SirReportAtivoRow,
  SirReportAtivosDim,
  SirReportAtivosDomain,
  SirReportAtivosFilters,
} from "@/lib/models/sir-report-ativos";
import {
  sirReportDddClause,
  sirReportPrefixClause,
  sirReportTreatmentClause,
} from "@/lib/queries/sir-report-scope";

type ListRow = RowDataPacket & {
  kind: "RAL" | "REC";
  num_recup: string;
  cf_executante: string | null;
  abertura: string | null;
  classification: string | null;
  summary: string | null;
  details: string | null;
  in_treatment: number;
};

/** Normaliza pageSize do drill-down. */
export function sirReportAtivosPageSize(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return SIR_CONCLUDED_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(raw), 1), SIR_CONCLUDED_MAX_PAGE_SIZE);
}

/** Monta cláusula extra da dimensão clicada. */
function dimClause(
  dim: SirReportAtivosDim,
  key: string,
  kind: "RAL" | "REC",
): { sql: string; params: string[] } {
  if (dim === "ddd") {
    return sirReportDddClause(key);
  }

  if (dim === "cf") {
    if (key === "Sem CF") {
      return {
        sql: " AND (cf_executante IS NULL OR TRIM(cf_executante) = '')",
        params: [],
      };
    }
    return { sql: " AND TRIM(cf_executante) = ?", params: [key] };
  }

  if (kind === "RAL") {
    if (key === "Sem tipo") {
      return {
        sql: " AND (tipo_ral IS NULL OR TRIM(tipo_ral) = '')",
        params: [],
      };
    }
    return { sql: " AND TRIM(tipo_ral) = ?", params: [key] };
  }

  if (key === "REC" || key === "DSR" || key === "TCQ") {
    return sirReportPrefixClause(key);
  }

  if (key === "Outros") {
    return {
      sql: ` AND num_recup NOT LIKE 'REC-%'
             AND num_recup NOT LIKE 'DSR-%'
             AND num_recup NOT LIKE 'TCQ-%'`,
      params: [],
    };
  }

  return { sql: " AND 1 = 0", params: [] };
}

/** Indica se a dimensão tipo faz sentido para o domínio. */
function tipoMatchesKind(key: string, kind: "RAL" | "REC"): boolean {
  if (kind === "RAL") {
    return !["REC", "DSR", "TCQ", "Outros"].includes(key);
  }
  return key === "REC" || key === "DSR" || key === "TCQ" || key === "Outros";
}

/** Fragmento SELECT de um domínio para união. */
function kindSelectSql(
  kind: "RAL" | "REC",
  filters: SirReportAtivosFilters,
): { sql: string; params: unknown[] } | null {
  if (filters.dim === "tipo" && !tipoMatchesKind(filters.key, kind)) {
    return null;
  }

  const table = kind === "RAL" ? SIR_TABLES.rals : SIR_TABLES.recs;
  const treatment = sirReportTreatmentClause(table, kind, filters.tratativa);
  const reportDdd = sirReportDddClause(filters.reportDdd);
  const dim = dimClause(filters.dim, filters.key, kind);
  const summaryExpr =
    kind === "RAL"
      ? "descricao"
      : "COALESCE(NULLIF(TRIM(cliente), ''), NULLIF(TRIM(designacao), ''))";
  const classificationExpr =
    kind === "RAL"
      ? `CASE WHEN tipo_ral IS NULL OR TRIM(tipo_ral) = '' THEN NULL ELSE TRIM(tipo_ral) END`
      : `CASE
           WHEN num_recup LIKE 'DSR%' THEN 'DSR'
           WHEN num_recup LIKE 'TCQ%' THEN 'TCQ'
           WHEN num_recup LIKE 'REC%' THEN 'REC'
           ELSE 'Outros'
         END`;
  const detailsExpr = kind === "RAL" ? "detalhes" : "detalhes_title";

  return {
    sql: `SELECT
            '${kind}' AS kind,
            num_recup,
            cf_executante,
            abertura,
            ${classificationExpr} AS classification,
            ${summaryExpr} AS summary,
            ${detailsExpr} AS details,
            CASE WHEN EXISTS (
              SELECT 1 FROM app_tratativas t
              WHERE t.record_kind = ?
                AND t.released_at IS NULL
                AND t.record_key COLLATE utf8mb4_unicode_ci =
                    CONVERT(${table}.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci
            ) THEN 1 ELSE 0 END AS in_treatment
          FROM ${table}
          WHERE status = 'ATIVO'
            ${treatment.sql}
            ${reportDdd.sql}
            ${dim.sql}`,
    params: [kind, ...treatment.params, ...reportDdd.params, ...dim.params],
  };
}

/** Lista ativos RAL/REC filtrados pela fatia do ranking. */
export async function listSirReportAtivos(
  filters: SirReportAtivosFilters,
): Promise<{ rows: SirReportAtivoRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = sirReportAtivosPageSize(filters.pageSize);
  const page = Math.max(1, Math.floor(filters.page || 1));
  const offset = (page - 1) * pageSize;
  const domain: SirReportAtivosDomain = filters.domain;

  const kinds: Array<"RAL" | "REC"> =
    domain === "RAL" ? ["RAL"] : domain === "REC" ? ["REC"] : ["RAL", "REC"];

  const parts = kinds
    .map((kind) => kindSelectSql(kind, filters))
    .filter((part): part is { sql: string; params: unknown[] } => part != null);

  if (parts.length === 0) {
    return { rows: [], total: 0, page, pageSize };
  }

  const unionSql = parts.map((part) => `(${part.sql})`).join(" UNION ALL ");
  const params = parts.flatMap((part) => part.params);

  const [countRows, listRows] = await Promise.all([
    sirQuery<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM (${unionSql}) AS u`, params),
    sirQuery<ListRow[]>(
      `SELECT * FROM (${unionSql}) AS u
       ORDER BY
         CASE WHEN abertura IS NULL OR TRIM(abertura) = '' THEN 1 ELSE 0 END,
         COALESCE(
           STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
           STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
         ) DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    ),
  ]);

  return {
    total: Number(countRows[0]?.total ?? 0),
    page,
    pageSize,
    rows: listRows.map((row) => ({
      kind: row.kind,
      numRecup: row.num_recup,
      cf: row.cf_executante,
      abertura: row.abertura,
      classification: row.classification,
      summary: row.summary,
      details: row.details,
      treatment: Number(row.in_treatment) === 1 ? "em-tratativa" : "pendente",
    })),
  };
}
