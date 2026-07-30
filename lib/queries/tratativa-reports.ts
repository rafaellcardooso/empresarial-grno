import type { RowDataPacket } from "mysql2";
import { TRATATIVA_REPORT_EVENT_LABELS } from "@/lib/config/relatorios-tratativa";
import {
  endExclusiveFromInclusiveDate,
  formatRelatorioDateParam,
} from "@/lib/config/relatorios-filters";
import { sqlRecordKindFilter } from "@/lib/config/relatorios-tratativa";
import { sirQuery } from "@/lib/db/sir";
import type {
  TratativaReportDailyPoint,
  TratativaReportData,
  TratativaReportEventSlice,
  TratativaReportFilters,
  TratativaReportOperatorRow,
  TratativaReportRankRow,
  TratativaReportSummary,
} from "@/lib/models/tratativa-report";
import { parseBsodAcionamentoAnalytics } from "@/lib/tratativa/parse-acionamento-message";

type DailyRow = RowDataPacket & { day: Date | string; total: number };
type OperatorRow = RowDataPacket & {
  user_name: string;
  user_corporate_id: string;
  acionamentos: number;
  concluidas: number;
};
type DurationRow = RowDataPacket & { avg_minutes: number | null };
type AcionamentoRow = RowDataPacket & {
  record_key: string;
  message_text: string | null;
};
type CohortSummaryRow = RowDataPacket & {
  assuncoes: number;
  acionamentos: number;
  validacoes_solicitadas: number;
  validacoes: number;
  validacoes_aprovadas: number;
  validacoes_reprovadas: number;
  concluidas: number;
  liberacoes: number;
};

/** Monta cláusula SQL opcional por record_kind. */
function kindClause(
  alias: string,
  kind: ReturnType<typeof sqlRecordKindFilter>,
): {
  sql: string;
  params: unknown[];
} {
  if (!kind) return { sql: "", params: [] };
  return { sql: ` AND ${alias}.record_kind = ?`, params: [kind] };
}

/** Opções de carregamento do relatório de tratativas. */
export type TratativaReportOptions = {
  includeOperators?: boolean;
};

/** Carrega painel analítico de tratativas no período informado. */
export async function getTratativaReport(
  filters: TratativaReportFilters,
  options: TratativaReportOptions = {},
): Promise<TratativaReportData> {
  const includeOperators = options.includeOperators ?? false;
  const kind = sqlRecordKindFilter(filters.recordKind);
  const from = filters.from;
  const toExclusive = endExclusiveFromInclusiveDate(filters.to);
  const kindEvents = kindClause("e", kind);
  const kindTratativas = kindClause("t", kind);

  const [summary, durationRow, daily, operators, acionamentos] = await Promise.all([
    loadCohortSummary(from, toExclusive, kindTratativas),
    sirQuery<DurationRow[]>(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, t.started_at, concluded.concluded_at)) AS avg_minutes
       FROM app_tratativas t
       INNER JOIN (
         SELECT e.tratativa_id, MIN(e.created_at) AS concluded_at
         FROM app_tratativa_events e
         WHERE e.event_type = 'CONCLUIDA'
           AND e.created_at < ?
           ${kindEvents.sql}
         GROUP BY e.tratativa_id
       ) concluded ON concluded.tratativa_id = t.id
       WHERE t.started_at >= ?
         AND t.started_at < ?
         ${kindTratativas.sql}`,
      [toExclusive, ...kindEvents.params, from, toExclusive, ...kindTratativas.params],
    ).then((rows) => rows[0]),
    loadDailySeries(from, toExclusive, kindEvents),
    includeOperators
      ? loadOperators(from, toExclusive, kindEvents)
      : Promise.resolve([] as TratativaReportOperatorRow[]),
    loadCohortAcionamentoRows(from, toExclusive, kindTratativas, kindEvents),
  ]);

  summary.duracaoMediaMinutos =
    durationRow?.avg_minutes != null ? Math.round(Number(durationRow.avg_minutes)) : null;

  const { bySymptom, topClients } = buildAcionamentoRankings(acionamentos);

  return {
    summary,
    daily,
    byEvent: buildEventDistribution(summary),
    operators,
    bySymptom,
    topClients,
  };
}

/** Conta etapas por chamado da coorte (iniciados no período), até o fim do período. */
async function loadCohortSummary(
  from: Date,
  toExclusive: Date,
  kindTratativas: { sql: string; params: unknown[] },
): Promise<TratativaReportSummary> {
  const rows = await sirQuery<CohortSummaryRow[]>(
    `SELECT
       COUNT(*) AS assuncoes,
       COUNT(DISTINCT CASE WHEN stage.has_acionamento = 1 THEN t.id END) AS acionamentos,
       COUNT(DISTINCT CASE WHEN stage.has_validacao_solicitada = 1 THEN t.id END)
         AS validacoes_solicitadas,
       COUNT(DISTINCT CASE WHEN stage.has_validacao = 1 THEN t.id END) AS validacoes,
       COUNT(DISTINCT CASE WHEN stage.has_validacao_aprovada = 1 THEN t.id END)
         AS validacoes_aprovadas,
       COUNT(DISTINCT CASE WHEN stage.has_validacao_reprovada = 1 THEN t.id END)
         AS validacoes_reprovadas,
       COUNT(DISTINCT CASE WHEN stage.has_concluida = 1 THEN t.id END) AS concluidas,
       COUNT(DISTINCT CASE WHEN t.released_at IS NOT NULL AND t.released_at < ? THEN t.id END)
         AS liberacoes
     FROM app_tratativas t
     LEFT JOIN (
       SELECT
         e.tratativa_id,
         MAX(CASE WHEN e.event_type = 'ACIONAMENTO' THEN 1 ELSE 0 END) AS has_acionamento,
         MAX(CASE WHEN e.event_type = 'VALIDACAO_SOLICITADA' THEN 1 ELSE 0 END)
           AS has_validacao_solicitada,
         MAX(CASE WHEN e.event_type = 'VALIDACAO' THEN 1 ELSE 0 END) AS has_validacao,
         MAX(
           CASE
             WHEN e.event_type = 'VALIDACAO' AND e.note NOT LIKE 'reprovada%' THEN 1
             ELSE 0
           END
         ) AS has_validacao_aprovada,
         MAX(
           CASE
             WHEN e.event_type = 'VALIDACAO' AND e.note LIKE 'reprovada%' THEN 1
             ELSE 0
           END
         ) AS has_validacao_reprovada,
         MAX(CASE WHEN e.event_type = 'CONCLUIDA' THEN 1 ELSE 0 END) AS has_concluida
       FROM app_tratativa_events e
       WHERE e.created_at < ?
       GROUP BY e.tratativa_id
     ) stage ON stage.tratativa_id = t.id
     WHERE t.started_at >= ?
       AND t.started_at < ?
       ${kindTratativas.sql}`,
    [toExclusive, toExclusive, from, toExclusive, ...kindTratativas.params],
  );

  const row = rows[0];
  return {
    assuncoes: Number(row?.assuncoes ?? 0),
    acionamentos: Number(row?.acionamentos ?? 0),
    validacoesSolicitadas: Number(row?.validacoes_solicitadas ?? 0),
    validacoes: Number(row?.validacoes ?? 0),
    validacoesAprovadas: Number(row?.validacoes_aprovadas ?? 0),
    validacoesReprovadas: Number(row?.validacoes_reprovadas ?? 0),
    concluidas: Number(row?.concluidas ?? 0),
    liberacoes: Number(row?.liberacoes ?? 0),
    duracaoMediaMinutos: null,
  };
}

/** Série de atividade diária (eventos ocorridos no período, não coorte). */
async function loadDailySeries(
  from: Date,
  toExclusive: Date,
  kindEvents: { sql: string; params: unknown[] },
): Promise<TratativaReportDailyPoint[]> {
  const rows = await sirQuery<DailyRow[]>(
    `SELECT DATE(e.created_at) AS day, COUNT(*) AS total
     FROM app_tratativa_events e
     WHERE e.created_at >= ? AND e.created_at < ?
       AND e.event_type IN ('ACIONAMENTO', 'VALIDACAO_SOLICITADA', 'VALIDACAO', 'CONCLUIDA')
       ${kindEvents.sql}
     GROUP BY DATE(e.created_at)
     ORDER BY day ASC`,
    [from, toExclusive, ...kindEvents.params],
  );

  return rows.map((row) => ({
    date: formatRelatorioDateParam(new Date(row.day)),
    total: Number(row.total),
  }));
}

function buildEventDistribution(summary: TratativaReportSummary): TratativaReportEventSlice[] {
  const slices: TratativaReportEventSlice[] = [
    { key: "START", label: TRATATIVA_REPORT_EVENT_LABELS.START, total: summary.assuncoes },
    {
      key: "ACIONAMENTO",
      label: TRATATIVA_REPORT_EVENT_LABELS.ACIONAMENTO,
      total: summary.acionamentos,
    },
    {
      key: "VALIDACAO_SOLICITADA",
      label: TRATATIVA_REPORT_EVENT_LABELS.VALIDACAO_SOLICITADA,
      total: summary.validacoesSolicitadas,
    },
    {
      key: "VALIDACAO_APROVADA",
      label: TRATATIVA_REPORT_EVENT_LABELS.VALIDACAO_APROVADA,
      total: summary.validacoesAprovadas,
    },
    {
      key: "VALIDACAO_REPROVADA",
      label: TRATATIVA_REPORT_EVENT_LABELS.VALIDACAO_REPROVADA,
      total: summary.validacoesReprovadas,
    },
    { key: "CONCLUIDA", label: TRATATIVA_REPORT_EVENT_LABELS.CONCLUIDA, total: summary.concluidas },
  ];

  return slices.filter((item) => item.total > 0);
}

/** Ranking de operadores por eventos ocorridos no período. */
async function loadOperators(
  from: Date,
  toExclusive: Date,
  kindEvents: { sql: string; params: unknown[] },
): Promise<TratativaReportOperatorRow[]> {
  const rows = await sirQuery<OperatorRow[]>(
    `SELECT u.name AS user_name,
            u.corporate_id AS user_corporate_id,
            SUM(CASE WHEN e.event_type = 'ACIONAMENTO' THEN 1 ELSE 0 END) AS acionamentos,
            SUM(CASE WHEN e.event_type = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
     FROM app_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.created_at >= ? AND e.created_at < ?
       AND e.event_type IN ('ACIONAMENTO', 'CONCLUIDA')
       ${kindEvents.sql}
     GROUP BY e.user_id, u.name, u.corporate_id
     HAVING acionamentos > 0 OR concluidas > 0
     ORDER BY acionamentos DESC, concluidas DESC, u.name ASC`,
    [from, toExclusive, ...kindEvents.params],
  );

  return rows.map((row) => ({
    userName: String(row.user_name),
    userCorporateId: String(row.user_corporate_id),
    acionamentos: Number(row.acionamentos),
    concluidas: Number(row.concluidas),
  }));
}

/** VTs da coorte registradas até o fim do período (sintomas e clientes). */
async function loadCohortAcionamentoRows(
  from: Date,
  toExclusive: Date,
  kindTratativas: { sql: string; params: unknown[] },
  kindEvents: { sql: string; params: unknown[] },
): Promise<AcionamentoRow[]> {
  return sirQuery<AcionamentoRow[]>(
    `SELECT e.record_key, e.message_text
     FROM app_tratativa_events e
     INNER JOIN app_tratativas t ON t.id = e.tratativa_id
     WHERE t.started_at >= ? AND t.started_at < ?
       ${kindTratativas.sql}
       AND e.event_type = 'ACIONAMENTO'
       AND e.created_at < ?
       ${kindEvents.sql}`,
    [from, toExclusive, ...kindTratativas.params, toExclusive, ...kindEvents.params],
  );
}

/** Agrega sintomas e clientes a partir das mensagens de VT registradas. */
function buildAcionamentoRankings(rows: AcionamentoRow[]): {
  bySymptom: TratativaReportRankRow[];
  topClients: TratativaReportRankRow[];
} {
  const symptomCounts = new Map<string, number>();
  const clientCounts = new Map<string, { label: string; total: number }>();

  for (const row of rows) {
    const parsed = parseBsodAcionamentoAnalytics(row.message_text);
    const sintoma = normalizeRankLabel(parsed.sintoma) ?? "Não informado";
    symptomCounts.set(sintoma, (symptomCounts.get(sintoma) ?? 0) + 1);

    const contrato = parsed.contrato?.trim();
    const clientKey = contrato ? `contrato:${contrato}` : `mac:${row.record_key}`;
    const clientLabel = contrato ?? `MAC ${row.record_key}`;
    const current = clientCounts.get(clientKey);
    if (current) {
      current.total += 1;
    } else {
      clientCounts.set(clientKey, { label: clientLabel, total: 1 });
    }
  }

  const bySymptom = [...symptomCounts.entries()]
    .map(([key, total]) => ({ key, label: key, total }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));

  const topClients = [...clientCounts.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      total: value.total,
      hint: key.startsWith("mac:") ? "Identificado por MAC" : undefined,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));

  return { bySymptom, topClients };
}

function normalizeRankLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
