import type { RowDataPacket } from "mysql2";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import {
  SDH_DDD_EMPTY,
  SDH_VENDOR_LABELS,
  sdhDddLabel,
  sdhDddSql,
  sdhVendorSql,
} from "@/lib/config/sdh-filters";
import { sdhReportEndExclusive } from "@/lib/config/sdh-report-filters";
import { sirQuery } from "@/lib/db/sir";
import type {
  SdhReportAgeBucket,
  SdhReportDailyPoint,
  SdhReportData,
  SdhReportFilters,
  SdhReportOperatorRow,
  SdhReportRankRow,
  SdhReportSlice,
  SdhReportSummary,
} from "@/lib/models/sdh-report";

type CountRow = RowDataPacket & {
  total_active: number;
  pending: number;
  in_progress: number;
  never_touched: number;
};
type AgeRow = RowDataPacket & {
  age_6_12h: number;
  age_12_24h: number;
  age_1_3d: number;
  age_over_3d: number;
};
type RankRow = RowDataPacket & { rank_key: string; total: number };
type PeriodRow = RowDataPacket & {
  starts_count: number;
  observations_count: number;
  legacy_updates_count: number;
  closes_count: number;
  alarms_touched: number;
};
type DailyRow = RowDataPacket & {
  day: Date | string;
  starts_count: number;
  observations_count: number;
  legacy_updates_count: number;
  closes_count: number;
  total: number;
};
type OperatorRow = RowDataPacket & {
  user_login: string;
  starts_count: number;
  observations_count: number;
  legacy_updates_count: number;
  closes_count: number;
  total: number;
};

/** Cláusulas comuns de escopo por vendor/DDD (backlog ou histórico). */
function scopeSql(filters: SdhReportFilters): { clause: string; params: string[] } {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  return {
    clause: `${vendor.clause} ${ddd.clause}`,
    params: [...vendor.params, ...ddd.params],
  };
}

/** Contagens do backlog ativo atual. */
async function loadSummaryBacklog(filters: SdhReportFilters): Promise<{
  totalActive: number;
  pending: number;
  inProgress: number;
  neverTouched: number;
}> {
  const scope = scopeSql(filters);
  const rows = await sirQuery<CountRow[]>(
    `SELECT
       COUNT(*) AS total_active,
       SUM(CASE WHEN a.em_tratativa = 0 THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN a.em_tratativa = 1 THEN 1 ELSE 0 END) AS in_progress,
       SUM(
         CASE
           WHEN NOT EXISTS (
             SELECT 1 FROM sdh_tratativa_events e WHERE e.alarm_id = a.id
           ) THEN 1 ELSE 0
         END
       ) AS never_touched
     FROM sdh_alarms a
     WHERE a.is_active = 1
     ${scope.clause}`,
    scope.params,
  );
  const row = rows[0];
  return {
    totalActive: Number(row?.total_active ?? 0),
    pending: Number(row?.pending ?? 0),
    inProgress: Number(row?.in_progress ?? 0),
    neverTouched: Number(row?.never_touched ?? 0),
  };
}

/** Contagens de eventos de tratativa no período (inclui alarmes já inativos). */
async function loadPeriodActivity(filters: SdhReportFilters): Promise<{
  startsInPeriod: number;
  observationsInPeriod: number;
  legacyUpdatesInPeriod: number;
  closesInPeriod: number;
  alarmsTouchedInPeriod: number;
}> {
  const scope = scopeSql(filters);
  const endExclusive = sdhReportEndExclusive(filters);
  const rows = await sirQuery<PeriodRow[]>(
    `SELECT
       SUM(CASE WHEN e.event_type = 'START' THEN 1 ELSE 0 END) AS starts_count,
       SUM(CASE WHEN e.event_type = 'OBSERVACAO' THEN 1 ELSE 0 END) AS observations_count,
       SUM(CASE WHEN e.event_type = 'UPDATE' THEN 1 ELSE 0 END) AS legacy_updates_count,
       SUM(CASE WHEN e.event_type = 'CLOSE' THEN 1 ELSE 0 END) AS closes_count,
       COUNT(DISTINCT e.alarm_id) AS alarms_touched
     FROM sdh_tratativa_events e
     INNER JOIN sdh_alarms a ON a.id = e.alarm_id
     WHERE e.created_at >= ?
       AND e.created_at < ?
       ${scope.clause}`,
    [filters.from, endExclusive, ...scope.params],
  );
  const row = rows[0];
  return {
    startsInPeriod: Number(row?.starts_count ?? 0),
    observationsInPeriod: Number(row?.observations_count ?? 0),
    legacyUpdatesInPeriod: Number(row?.legacy_updates_count ?? 0),
    closesInPeriod: Number(row?.closes_count ?? 0),
    alarmsTouchedInPeriod: Number(row?.alarms_touched ?? 0),
  };
}

/** Faixas de idade dos alarmes ativos por data_alarme. */
async function loadAgeBuckets(filters: SdhReportFilters): Promise<SdhReportAgeBucket[]> {
  const scope = scopeSql(filters);
  const rows = await sirQuery<AgeRow[]>(
    `SELECT
       SUM(CASE
         WHEN a.data_alarme IS NOT NULL
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) >= 6
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) < 12
         THEN 1 ELSE 0 END) AS age_6_12h,
       SUM(CASE
         WHEN a.data_alarme IS NOT NULL
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) >= 12
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) < 24
         THEN 1 ELSE 0 END) AS age_12_24h,
       SUM(CASE
         WHEN a.data_alarme IS NOT NULL
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) >= 24
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) < 72
         THEN 1 ELSE 0 END) AS age_1_3d,
       SUM(CASE
         WHEN a.data_alarme IS NOT NULL
          AND TIMESTAMPDIFF(HOUR, a.data_alarme, NOW()) >= 72
         THEN 1 ELSE 0 END) AS age_over_3d
     FROM sdh_alarms a
     WHERE a.is_active = 1
     ${scope.clause}`,
    scope.params,
  );
  const row = rows[0];
  return [
    { key: "6-12h", label: "6–12 h", total: Number(row?.age_6_12h ?? 0) },
    { key: "12-24h", label: "12–24 h", total: Number(row?.age_12_24h ?? 0) },
    { key: "1-3d", label: "1–3 dias", total: Number(row?.age_1_3d ?? 0) },
    { key: "over-3d", label: "Acima de 3 dias", total: Number(row?.age_over_3d ?? 0) },
  ];
}

/** Ranking genérico sobre alarmes ativos. */
async function loadRank(
  filters: SdhReportFilters,
  expression: string,
  emptyLabel: string,
): Promise<SdhReportRankRow[]> {
  const scope = scopeSql(filters);
  const rows = await sirQuery<RankRow[]>(
    `SELECT
       CASE
         WHEN ${expression} IS NULL OR TRIM(${expression}) = '' THEN ?
         ELSE TRIM(${expression})
       END AS rank_key,
       COUNT(*) AS total
     FROM sdh_alarms a
     WHERE a.is_active = 1
     ${scope.clause}
     GROUP BY rank_key
     ORDER BY total DESC, rank_key ASC`,
    [emptyLabel, ...scope.params],
  );
  return rows.map((row) => ({
    key: String(row.rank_key),
    label: String(row.rank_key),
    total: Number(row.total),
  }));
}

/** Ranking por DDD com rótulo `91 - PA`. */
async function loadByDdd(filters: SdhReportFilters): Promise<SdhReportRankRow[]> {
  const scope = scopeSql(filters);
  const rows = await sirQuery<RankRow[]>(
    `SELECT
       CASE
         WHEN a.ddd IS NULL OR TRIM(a.ddd) = '' THEN ?
         ELSE TRIM(a.ddd)
       END AS rank_key,
       COUNT(*) AS total
     FROM sdh_alarms a
     WHERE a.is_active = 1
     ${scope.clause}
     GROUP BY rank_key
     ORDER BY total DESC, rank_key ASC`,
    [SDH_DDD_EMPTY, ...scope.params],
  );
  return rows.map((row) => ({
    key: String(row.rank_key),
    label: sdhDddLabel(String(row.rank_key)),
    total: Number(row.total),
  }));
}

/** Ranking por grupo de gerência (Datacom/Tellabs/Outros). */
async function loadByVendor(filters: SdhReportFilters): Promise<SdhReportRankRow[]> {
  const scope = scopeSql(filters);
  const rows = await sirQuery<RankRow[]>(
    `SELECT
       CASE
         WHEN LOWER(TRIM(COALESCE(a.gerencia, ''))) = 'datacom' THEN 'datacom'
         WHEN LOWER(COALESCE(a.gerencia, '')) LIKE '%tellabs%' THEN 'tellabs'
         ELSE 'outros'
       END AS rank_key,
       COUNT(*) AS total
     FROM sdh_alarms a
     WHERE a.is_active = 1
     ${scope.clause}
     GROUP BY rank_key
     ORDER BY total DESC, rank_key ASC`,
    scope.params,
  );
  return rows.map((row) => {
    const key = String(row.rank_key) as keyof typeof SDH_VENDOR_LABELS;
    return {
      key: String(row.rank_key),
      label: SDH_VENDOR_LABELS[key] ?? String(row.rank_key),
      total: Number(row.total),
    };
  });
}

/** Série diária de START/OBSERVACAO/UPDATE/CLOSE no período. */
async function loadDaily(filters: SdhReportFilters): Promise<SdhReportDailyPoint[]> {
  const scope = scopeSql(filters);
  const endExclusive = sdhReportEndExclusive(filters);
  const rows = await sirQuery<DailyRow[]>(
    `SELECT
       DATE(e.created_at) AS day,
       SUM(CASE WHEN e.event_type = 'START' THEN 1 ELSE 0 END) AS starts_count,
       SUM(CASE WHEN e.event_type = 'OBSERVACAO' THEN 1 ELSE 0 END) AS observations_count,
       SUM(CASE WHEN e.event_type = 'UPDATE' THEN 1 ELSE 0 END) AS legacy_updates_count,
       SUM(CASE WHEN e.event_type = 'CLOSE' THEN 1 ELSE 0 END) AS closes_count,
       COUNT(*) AS total
     FROM sdh_tratativa_events e
     INNER JOIN sdh_alarms a ON a.id = e.alarm_id
     WHERE e.created_at >= ?
       AND e.created_at < ?
       ${scope.clause}
     GROUP BY DATE(e.created_at)
     ORDER BY day ASC`,
    [filters.from, endExclusive, ...scope.params],
  );
  return rows.map((row) => {
    const date =
      row.day instanceof Date ? formatRelatorioDateParam(row.day) : String(row.day).slice(0, 10);
    return {
      date,
      starts: Number(row.starts_count ?? 0),
      observations: Number(row.observations_count ?? 0),
      legacyUpdates: Number(row.legacy_updates_count ?? 0),
      closes: Number(row.closes_count ?? 0),
      total: Number(row.total ?? 0),
    };
  });
}

/** Ranking de logins por eventos no período (histórico completo). */
async function loadOperators(filters: SdhReportFilters): Promise<SdhReportOperatorRow[]> {
  const scope = scopeSql(filters);
  const endExclusive = sdhReportEndExclusive(filters);
  const rows = await sirQuery<OperatorRow[]>(
    `SELECT
       u.corporate_id AS user_login,
       SUM(CASE WHEN e.event_type = 'START' THEN 1 ELSE 0 END) AS starts_count,
       SUM(CASE WHEN e.event_type = 'OBSERVACAO' THEN 1 ELSE 0 END) AS observations_count,
       SUM(CASE WHEN e.event_type = 'UPDATE' THEN 1 ELSE 0 END) AS legacy_updates_count,
       SUM(CASE WHEN e.event_type = 'CLOSE' THEN 1 ELSE 0 END) AS closes_count,
       COUNT(*) AS total
     FROM sdh_tratativa_events e
     INNER JOIN sdh_alarms a ON a.id = e.alarm_id
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.created_at >= ?
       AND e.created_at < ?
       ${scope.clause}
     GROUP BY u.corporate_id
     ORDER BY total DESC, user_login ASC`,
    [filters.from, endExclusive, ...scope.params],
  );
  return rows.map((row) => ({
    userLogin: String(row.user_login),
    starts: Number(row.starts_count ?? 0),
    observations: Number(row.observations_count ?? 0),
    legacyUpdates: Number(row.legacy_updates_count ?? 0),
    closes: Number(row.closes_count ?? 0),
    total: Number(row.total ?? 0),
  }));
}

/** Opções de carregamento do relatório SDH. */
export type SdhReportOptions = {
  includeOperators?: boolean;
};

/** Carrega o payload analítico completo do relatório SDH. */
export async function getSdhReport(
  filters: SdhReportFilters,
  options: SdhReportOptions = {},
): Promise<SdhReportData> {
  const includeOperators = options.includeOperators ?? false;
  const [backlog, period, ageBuckets, byDdd, byVendor, byMunicipio, byAlarme, daily, operators] =
    await Promise.all([
      loadSummaryBacklog(filters),
      loadPeriodActivity(filters),
      loadAgeBuckets(filters),
      loadByDdd(filters),
      loadByVendor(filters),
      loadRank(filters, "a.municipio", "Sem município"),
      loadRank(filters, "a.alarme", "Sem alarme"),
      loadDaily(filters),
      includeOperators ? loadOperators(filters) : Promise.resolve([] as SdhReportOperatorRow[]),
    ]);

  const summary: SdhReportSummary = {
    ...backlog,
    ...period,
  };

  const statusSlices: SdhReportSlice[] = [
    { key: "pending", label: "Pendente", total: summary.pending },
    { key: "in-progress", label: "Em tratativa", total: summary.inProgress },
  ].filter((slice) => slice.total > 0);

  return {
    summary,
    statusSlices,
    ageBuckets,
    byDdd,
    byVendor,
    byMunicipio: byMunicipio.map((row) => ({
      ...row,
      label: row.label === "Sem município" ? row.label : row.label.toUpperCase(),
    })),
    byAlarme,
    daily,
    operators,
  };
}
