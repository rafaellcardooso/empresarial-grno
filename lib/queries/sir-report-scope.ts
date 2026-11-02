import { sirLocationCodesForDdd } from "@/lib/config/sir-locations";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import { SIR_TABLES } from "@/lib/models";
import type { SirReportFilters } from "@/lib/models/sir-report";

/** Cláusula de tratativa ativa correlacionada. */
export function sirReportTreatmentClause(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  treatment?: SirTreatmentFilter,
): { sql: string; params: string[] } {
  if (!treatment) return { sql: "", params: [] };
  const exists = `EXISTS (
    SELECT 1 FROM app_tratativas t
    WHERE t.record_kind = ?
      AND t.released_at IS NULL
      AND t.record_key COLLATE utf8mb4_unicode_ci =
          CONVERT(${table}.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci
  )`;
  return {
    sql: ` AND ${treatment === "pendente" ? "NOT " : ""}${exists}`,
    params: [kind],
  };
}

/** Cláusula de DDD via segundo segmento do CF. */
export function sirReportDddClause(ddd?: string): { sql: string; params: string[] } {
  if (!ddd) return { sql: "", params: [] };
  const codes = sirLocationCodesForDdd(ddd);
  if (codes.length === 0) return { sql: " AND 1 = 0", params: [] };
  const placeholders = codes.map(() => "?").join(", ");
  return {
    sql: ` AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(cf_executante, '/', 2), '/', -1))
      IN (${placeholders})`,
    params: codes,
  };
}

/** Cláusula opcional por prefixo de num_recup (REC-/DSR-/TCQ-). */
export function sirReportPrefixClause(prefix?: string): { sql: string; params: string[] } {
  if (!prefix) return { sql: "", params: [] };
  return { sql: " AND num_recup LIKE ?", params: [`${prefix}-%`] };
}

/** Escopo comum ATIVO + tratativa + DDD (+ prefixo opcional). */
export function sirReportActiveScope(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
  prefix?: string,
): { sql: string; params: string[] } {
  const treatment = sirReportTreatmentClause(table, kind, filters.tratativa);
  const ddd = sirReportDddClause(filters.ddd);
  const byPrefix = sirReportPrefixClause(prefix);
  return {
    sql: ` WHERE status = 'ATIVO' ${treatment.sql} ${ddd.sql}${byPrefix.sql}`,
    params: [...treatment.params, ...ddd.params, ...byPrefix.params],
  };
}
