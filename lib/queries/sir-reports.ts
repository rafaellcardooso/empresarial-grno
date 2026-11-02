import type { RowDataPacket } from "mysql2";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { operationalDddLabel } from "@/lib/config/locations";
import { sirDddFromCf } from "@/lib/config/sir-locations";
import { sirReportEndExclusive } from "@/lib/config/sir-report-filters";
import { sirQuery } from "@/lib/db/sir";
import { SIR_TABLES } from "@/lib/models";
import { REC_TIPOS } from "@/lib/config/rec-types";
import type {
  SirReportAgeBucket,
  SirReportDailyPoint,
  SirReportData,
  SirReportDomainSummary,
  SirReportFilters,
  SirReportKpiScope,
  SirReportRankRow,
} from "@/lib/models/sir-report";
import {
  sirReportActiveScope,
  sirReportDddClause,
  sirReportPrefixClause,
  sirReportTreatmentClause,
} from "@/lib/queries/sir-report-scope";

/** Expressão SQL para parsear abertura SIR. */
const SIR_ABERTURA_EXPR = `COALESCE(
  STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
  STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
)`;

type BacklogRow = RowDataPacket & {
  total_active: number;
  pending: number;
  in_treatment: number;
};
type CountRow = RowDataPacket & { total: number };
type AgeRow = RowDataPacket & {
  age_0_6h: number;
  age_6_24h: number;
  age_1_3d: number;
  age_over_3d: number;
};
type RankRow = RowDataPacket & { rank_key: string; total: number };
type DailyRow = RowDataPacket & { day: Date | string; total: number };
type CfRow = RowDataPacket & { cf_executante: string; total: number };

const EMPTY_DOMAIN: SirReportDomainSummary = {
  totalActive: 0,
  pending: 0,
  inTreatment: 0,
  openingsInPeriod: 0,
  conclusionsInPeriod: 0,
};

/** Backlog ativo com pendentes e em tratativa. */
async function loadDomainBacklog(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
  prefix?: string,
): Promise<Omit<SirReportDomainSummary, "openingsInPeriod" | "conclusionsInPeriod">> {
  const scope = sirReportActiveScope(table, kind, filters, prefix);
  const rows = await sirQuery<BacklogRow[]>(
    `SELECT
       COUNT(*) AS total_active,
       SUM(CASE WHEN NOT EXISTS (
         SELECT 1 FROM app_tratativas t
         WHERE t.record_kind = ? AND t.released_at IS NULL
           AND t.record_key COLLATE utf8mb4_unicode_ci =
               CONVERT(${table}.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci
       ) THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN EXISTS (
         SELECT 1 FROM app_tratativas t
         WHERE t.record_kind = ? AND t.released_at IS NULL
           AND t.record_key COLLATE utf8mb4_unicode_ci =
               CONVERT(${table}.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci
       ) THEN 1 ELSE 0 END) AS in_treatment
     FROM ${table}
     ${scope.sql}`,
    [kind, kind, ...scope.params],
  );
  const row = rows[0];
  return {
    totalActive: Number(row?.total_active ?? 0),
    pending: Number(row?.pending ?? 0),
    inTreatment: Number(row?.in_treatment ?? 0),
  };
}

/** Aberturas cujo timestamp parseado cai no período. */
async function loadOpeningsInPeriod(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
  prefix?: string,
): Promise<number> {
  const treatment = sirReportTreatmentClause(table, kind, filters.tratativa);
  const ddd = sirReportDddClause(filters.ddd);
  const byPrefix = sirReportPrefixClause(prefix);
  const endExclusive = sirReportEndExclusive(filters);
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM ${table}
     WHERE ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND ${SIR_ABERTURA_EXPR} >= ?
       AND ${SIR_ABERTURA_EXPR} < ?
       ${treatment.sql}
       ${ddd.sql}
       ${byPrefix.sql}`,
    [filters.from, endExclusive, ...treatment.params, ...ddd.params, ...byPrefix.params],
  );
  return Number(rows[0]?.total ?? 0);
}

/** Conclusões (`CONCLUIDA`) no período, opcionalmente filtradas por DDD/prefixo. */
async function loadConclusionsInPeriod(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
  prefix?: string,
): Promise<number> {
  const ddd = sirReportDddClause(filters.ddd);
  const byPrefix = sirReportPrefixClause(prefix);
  const endExclusive = sirReportEndExclusive(filters);
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(DISTINCT e.tratativa_id) AS total
     FROM app_tratativa_events e
     INNER JOIN ${table} r
       ON CONVERT(r.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
          e.record_key COLLATE utf8mb4_unicode_ci
     WHERE e.record_kind = ?
       AND e.event_type = 'CONCLUIDA'
       AND e.created_at >= ?
       AND e.created_at < ?
       ${ddd.sql}
       ${byPrefix.sql.replace(/num_recup/g, "r.num_recup")}`,
    [kind, filters.from, endExclusive, ...ddd.params, ...byPrefix.params],
  );
  return Number(rows[0]?.total ?? 0);
}

/** Faixas de idade dos ativos a partir da abertura. */
async function loadAgeBuckets(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<SirReportAgeBucket[]> {
  const scope = sirReportActiveScope(table, kind, filters);
  const rows = await sirQuery<AgeRow[]>(
    `SELECT
       SUM(CASE WHEN ${SIR_ABERTURA_EXPR} IS NOT NULL
         AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) < 6 THEN 1 ELSE 0 END) AS age_0_6h,
       SUM(CASE WHEN ${SIR_ABERTURA_EXPR} IS NOT NULL
         AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) BETWEEN 6 AND 23 THEN 1 ELSE 0 END) AS age_6_24h,
       SUM(CASE WHEN ${SIR_ABERTURA_EXPR} IS NOT NULL
         AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) BETWEEN 24 AND 71 THEN 1 ELSE 0 END) AS age_1_3d,
       SUM(CASE WHEN ${SIR_ABERTURA_EXPR} IS NOT NULL
         AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) >= 72 THEN 1 ELSE 0 END) AS age_over_3d
     FROM ${table}
     ${scope.sql}`,
    scope.params,
  );
  const row = rows[0];
  return [
    { key: "0-6h", label: "Até 6 h", total: Number(row?.age_0_6h ?? 0), domain: kind },
    { key: "6-24h", label: "6–24 h", total: Number(row?.age_6_24h ?? 0), domain: kind },
    { key: "1-3d", label: "1–3 dias", total: Number(row?.age_1_3d ?? 0), domain: kind },
    {
      key: "over-3d",
      label: "Acima de 3 dias",
      total: Number(row?.age_over_3d ?? 0),
      domain: kind,
    },
  ];
}

/** Ranking por CF dos ativos. */
async function loadByCf(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<SirReportRankRow[]> {
  const scope = sirReportActiveScope(table, kind, filters);
  const rows = await sirQuery<RankRow[]>(
    `SELECT
       CASE WHEN cf_executante IS NULL OR TRIM(cf_executante) = '' THEN 'Sem CF'
            ELSE TRIM(cf_executante) END AS rank_key,
       COUNT(*) AS total
     FROM ${table}
     ${scope.sql}
     GROUP BY rank_key
     ORDER BY total DESC, rank_key ASC
     LIMIT 15`,
    scope.params,
  );
  return rows.map((row) => ({
    key: String(row.rank_key),
    label: String(row.rank_key),
    total: Number(row.total),
    domain: kind,
  }));
}

/** Ranking por tipo (RAL: tipo_ral; REC: prefixo do num_recup). */
async function loadByTipo(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<SirReportRankRow[]> {
  const scope = sirReportActiveScope(table, kind, filters);
  const expression =
    kind === "RAL"
      ? `CASE WHEN tipo_ral IS NULL OR TRIM(tipo_ral) = '' THEN 'Sem tipo' ELSE TRIM(tipo_ral) END`
      : `CASE
           WHEN num_recup LIKE 'DSR%' THEN 'DSR'
           WHEN num_recup LIKE 'TCQ%' THEN 'TCQ'
           WHEN num_recup LIKE 'REC%' THEN 'REC'
           ELSE 'Outros'
         END`;
  const rows = await sirQuery<RankRow[]>(
    `SELECT ${expression} AS rank_key, COUNT(*) AS total
     FROM ${table}
     ${scope.sql}
     GROUP BY rank_key
     ORDER BY total DESC, rank_key ASC`,
    scope.params,
  );
  return rows.map((row) => ({
    key: String(row.rank_key),
    label: String(row.rank_key),
    total: Number(row.total),
    domain: kind,
  }));
}

/** Ranking por DDD operacional a partir das contagens de CF. */
async function loadByDdd(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<SirReportRankRow[]> {
  const scope = sirReportActiveScope(table, kind, filters);
  const rows = await sirQuery<CfRow[]>(
    `SELECT cf_executante, COUNT(*) AS total
     FROM ${table}
     ${scope.sql}
       AND cf_executante IS NOT NULL AND TRIM(cf_executante) <> ''
     GROUP BY cf_executante`,
    scope.params,
  );
  const totals = new Map<string, number>();
  for (const row of rows) {
    const ddd = sirDddFromCf(row.cf_executante);
    if (!ddd) continue;
    if (filters.ddd && ddd !== filters.ddd) continue;
    totals.set(ddd, (totals.get(ddd) ?? 0) + Number(row.total));
  }
  return [...totals.entries()]
    .map(([ddd, total]) => ({
      key: ddd,
      label: operationalDddLabel(ddd),
      total,
      domain: kind as "RAL" | "REC",
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));
}

/** Série diária de aberturas no período. */
async function loadDailyOpenings(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<Map<string, number>> {
  const treatment = sirReportTreatmentClause(table, kind, filters.tratativa);
  const ddd = sirReportDddClause(filters.ddd);
  const endExclusive = sirReportEndExclusive(filters);
  const rows = await sirQuery<DailyRow[]>(
    `SELECT DATE(${SIR_ABERTURA_EXPR}) AS day, COUNT(*) AS total
     FROM ${table}
     WHERE ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND ${SIR_ABERTURA_EXPR} >= ?
       AND ${SIR_ABERTURA_EXPR} < ?
       ${treatment.sql}
       ${ddd.sql}
     GROUP BY DATE(${SIR_ABERTURA_EXPR})
     ORDER BY day ASC`,
    [filters.from, endExclusive, ...treatment.params, ...ddd.params],
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    const date =
      row.day instanceof Date ? formatRelatorioDateParam(row.day) : String(row.day).slice(0, 10);
    map.set(date, Number(row.total));
  }
  return map;
}

/** Série diária de conclusões (`CONCLUIDA`) no período. */
async function loadDailyConclusions(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
): Promise<Map<string, number>> {
  const ddd = sirReportDddClause(filters.ddd);
  const endExclusive = sirReportEndExclusive(filters);
  const rows = await sirQuery<DailyRow[]>(
    `SELECT DATE(e.created_at) AS day, COUNT(DISTINCT e.tratativa_id) AS total
     FROM app_tratativa_events e
     INNER JOIN ${table} r
       ON CONVERT(r.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
          e.record_key COLLATE utf8mb4_unicode_ci
     WHERE e.record_kind = ?
       AND e.event_type = 'CONCLUIDA'
       AND e.created_at >= ?
       AND e.created_at < ?
       ${ddd.sql}
     GROUP BY DATE(e.created_at)
     ORDER BY day ASC`,
    [kind, filters.from, endExclusive, ...ddd.params],
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    const date =
      row.day instanceof Date ? formatRelatorioDateParam(row.day) : String(row.day).slice(0, 10);
    map.set(date, Number(row.total));
  }
  return map;
}

/** Monta resumo de um domínio (opcionalmente filtrado por prefixo REC/DSR/TCQ). */
async function loadDomainSummary(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
  prefix?: string,
): Promise<SirReportDomainSummary> {
  const [backlog, openingsInPeriod, conclusionsInPeriod] = await Promise.all([
    loadDomainBacklog(table, kind, filters, prefix),
    loadOpeningsInPeriod(table, kind, filters, prefix),
    loadConclusionsInPeriod(table, kind, filters, prefix),
  ]);
  return { ...backlog, openingsInPeriod, conclusionsInPeriod };
}

/** Carrega agregações e rankings de um domínio. */
async function loadDomainBundle(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  kind: "RAL" | "REC",
  filters: SirReportFilters,
) {
  const [summary, ageBuckets, byCf, byTipo, byDdd, daily, dailyConclusions] = await Promise.all([
    loadDomainSummary(table, kind, filters),
    loadAgeBuckets(table, kind, filters),
    loadByCf(table, kind, filters),
    loadByTipo(table, kind, filters),
    loadByDdd(table, kind, filters),
    loadDailyOpenings(table, kind, filters),
    loadDailyConclusions(table, kind, filters),
  ]);
  return { summary, ageBuckets, byCf, byTipo, byDdd, daily, dailyConclusions };
}

/** Carrega o payload analítico completo do relatório SIR. */
export async function getSirReport(filters: SirReportFilters): Promise<SirReportData> {
  const includeRal = filters.domain === "all" || filters.domain === "ral";
  const includeRec = filters.domain === "all" || filters.domain === "rec";

  const emptyBundle = {
    summary: EMPTY_DOMAIN,
    ageBuckets: [] as SirReportAgeBucket[],
    byCf: [] as SirReportRankRow[],
    byTipo: [] as SirReportRankRow[],
    byDdd: [] as SirReportRankRow[],
    daily: new Map<string, number>(),
    dailyConclusions: new Map<string, number>(),
  };

  const [ral, rec] = await Promise.all([
    includeRal ? loadDomainBundle(SIR_TABLES.rals, "RAL", filters) : Promise.resolve(emptyBundle),
    includeRec ? loadDomainBundle(SIR_TABLES.recs, "REC", filters) : Promise.resolve(emptyBundle),
  ]);

  const openingDates = new Set([...ral.daily.keys(), ...rec.daily.keys()]);
  const dailyOpenings: SirReportDailyPoint[] = [...openingDates].sort().map((date) => {
    const ralCount = ral.daily.get(date) ?? 0;
    const recCount = rec.daily.get(date) ?? 0;
    return { date, ral: ralCount, rec: recCount, total: ralCount + recCount };
  });

  const conclusionDates = new Set([...ral.dailyConclusions.keys(), ...rec.dailyConclusions.keys()]);
  const dailyConclusions: SirReportDailyPoint[] = [...conclusionDates].sort().map((date) => {
    const ralCount = ral.dailyConclusions.get(date) ?? 0;
    const recCount = rec.dailyConclusions.get(date) ?? 0;
    return { date, ral: ralCount, rec: recCount, total: ralCount + recCount };
  });

  const scopes: SirReportKpiScope[] = [];
  if (includeRal) {
    scopes.push({ key: "RAL", label: "RAL", ...ral.summary });
  }
  if (includeRec) {
    const tipoSummaries = await Promise.all(
      REC_TIPOS.map(async (tipo) => {
        const summary = await loadDomainSummary(SIR_TABLES.recs, "REC", filters, tipo.prefix);
        return {
          key: tipo.prefix as SirReportKpiScope["key"],
          label: tipo.label,
          ...summary,
        } satisfies SirReportKpiScope;
      }),
    );
    scopes.push(...tipoSummaries);
  }

  return {
    summary: { ral: ral.summary, rec: rec.summary, scopes },
    ageBuckets: [...ral.ageBuckets, ...rec.ageBuckets],
    byCf: [...ral.byCf, ...rec.byCf],
    byTipo: [...ral.byTipo, ...rec.byTipo],
    byDdd: [...ral.byDdd, ...rec.byDdd],
    dailyOpenings,
    dailyConclusions,
  };
}
