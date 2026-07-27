import type { RowDataPacket } from "mysql2";
import {
  type TratativaChamadoStatus,
  type TratativaChamadoStatusFilter,
} from "@/lib/config/tratativa-chamados";
import { parseValidacaoOutcomeFromNote } from "@/lib/config/tratativa-workflow";
import { endExclusiveFromInclusiveDate } from "@/lib/config/relatorios-filters";
import { sirQuery } from "@/lib/db/sir";
import type { TratativaChamadoRow } from "@/lib/models/tratativa-report";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import { parseValidacaoFcaMessage } from "@/lib/tratativa/validate-validacao-fca";
import { deriveTratativaWorkflowStatus } from "@/lib/queries/tratativa-workflow";

type TratativaListRow = RowDataPacket & {
  id: number;
  record_key: string;
  user_name: string;
  user_corporate_id: string;
  started_at: Date | string;
  released_at: Date | string | null;
};

type EventListRow = RowDataPacket & {
  tratativa_id: number;
  event_type: string;
  note: string | null;
  message_text?: string | null;
  created_at: Date | string;
};

const LIST_LIMIT = 500;

const WORKFLOW_EVENT_TYPES = [
  "ACIONAMENTO",
  "VALIDACAO_SOLICITADA",
  "VALIDACAO",
  "CONCLUIDA",
] as const;

/** Deriva status de listagem (pipeline ativo ou concluído). */
export function deriveTratativaChamadoStatus(
  events: Array<{ event_type: string; note?: string | null }>,
): TratativaChamadoStatus {
  if (events.some((event) => event.event_type === "CONCLUIDA")) {
    return "concluido";
  }
  return deriveTratativaWorkflowStatus(events);
}

/** Lista chamados BSOD do período com status derivado e filtro opcional. */
export async function listTratativaChamados(input: {
  from: Date;
  to: Date;
  status?: TratativaChamadoStatusFilter;
}): Promise<{
  rows: TratativaChamadoRow[];
  counts: Record<TratativaChamadoStatusFilter, number>;
}> {
  const from = input.from;
  const toExclusive = endExclusiveFromInclusiveDate(input.to);
  const statusFilter = input.status ?? "all";

  const tratativas = await sirQuery<TratativaListRow[]>(
    `SELECT t.id, t.record_key, u.name AS user_name, u.corporate_id AS user_corporate_id,
            t.started_at, t.released_at
     FROM app_tratativas t
     INNER JOIN app_users u ON u.id = t.user_id
     WHERE t.record_kind = 'BSOD'
       AND (
         (t.started_at >= ? AND t.started_at < ?)
         OR EXISTS (
           SELECT 1 FROM app_tratativa_events e
           WHERE e.tratativa_id = t.id
             AND e.created_at >= ?
             AND e.created_at < ?
         )
       )
     ORDER BY t.started_at DESC
     LIMIT ${LIST_LIMIT}`,
    [from, toExclusive, from, toExclusive],
  );

  const emptyCounts = emptyStatusCounts();
  if (tratativas.length === 0) {
    return { rows: [], counts: emptyCounts };
  }

  const ids = tratativas.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const eventRows = await sirQuery<EventListRow[]>(
    `SELECT tratativa_id, event_type, note, message_text, created_at
     FROM app_tratativa_events
     WHERE tratativa_id IN (${placeholders})
       AND event_type IN (${WORKFLOW_EVENT_TYPES.map(() => "?").join(", ")})
     ORDER BY tratativa_id ASC, created_at ASC`,
    [...ids, ...WORKFLOW_EVENT_TYPES],
  );

  const eventsByTratativa = new Map<number, EventListRow[]>();
  for (const event of eventRows) {
    const list = eventsByTratativa.get(event.tratativa_id) ?? [];
    list.push(event);
    eventsByTratativa.set(event.tratativa_id, list);
  }

  const allRows: TratativaChamadoRow[] = tratativas.map((row) => {
    const events = eventsByTratativa.get(row.id) ?? [];
    const status = deriveTratativaChamadoStatus(events);
    const concludedAt = findEventTime(events, "CONCLUIDA");
    const acionadoAt = findEventTime(events, "ACIONAMENTO");
    const latestValidacao = findLatestValidacao(events);

    return {
      id: row.id,
      recordKey: row.record_key,
      userName: row.user_name,
      userCorporateId: row.user_corporate_id,
      status,
      startedAt: normalizeDateTimeIso(row.started_at) ?? String(row.started_at),
      acionadoAt,
      validatedAt: latestValidacao ? normalizeDateTimeIso(latestValidacao.created_at) : null,
      concludedAt,
      releasedAt: normalizeDateTimeIso(row.released_at),
      outcome: latestValidacao ? parseValidacaoOutcomeFromNote(latestValidacao.note) : null,
      fca: latestValidacao ? parseValidacaoFcaMessage(latestValidacao.message_text) : null,
    };
  });

  for (const row of allRows) {
    emptyCounts.all += 1;
    emptyCounts[row.status] += 1;
  }

  const rows =
    statusFilter === "all" ? allRows : allRows.filter((row) => row.status === statusFilter);

  return { rows, counts: emptyCounts };
}

/** Lista MACs com tratativa BSOD ativa no status informado (filtro inventário). */
export async function listActiveBsodKeysByChamadoStatus(
  status: TratativaChamadoStatus,
): Promise<string[]> {
  if (status === "concluido") return [];

  const active = await sirQuery<Array<{ id: number; record_key: string } & RowDataPacket>>(
    `SELECT t.id, t.record_key
     FROM app_tratativas t
     WHERE t.record_kind = 'BSOD' AND t.released_at IS NULL`,
  );
  if (active.length === 0) return [];

  const ids = active.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const eventRows = await sirQuery<EventListRow[]>(
    `SELECT tratativa_id, event_type, note, created_at
     FROM app_tratativa_events
     WHERE tratativa_id IN (${placeholders})
       AND event_type IN (${WORKFLOW_EVENT_TYPES.map(() => "?").join(", ")})
     ORDER BY tratativa_id ASC, created_at ASC`,
    [...ids, ...WORKFLOW_EVENT_TYPES],
  );

  const eventsByTratativa = new Map<number, EventListRow[]>();
  for (const event of eventRows) {
    const list = eventsByTratativa.get(event.tratativa_id) ?? [];
    list.push(event);
    eventsByTratativa.set(event.tratativa_id, list);
  }

  return active
    .filter((row) => deriveTratativaChamadoStatus(eventsByTratativa.get(row.id) ?? []) === status)
    .map((row) => String(row.record_key).toUpperCase());
}

/** Contagens de tratativas BSOD ativas por status de pipeline. */
export async function countActiveBsodByChamadoStatus(): Promise<
  Record<Exclude<TratativaChamadoStatus, "concluido"> | "all", number>
> {
  const active = await sirQuery<Array<{ id: number } & RowDataPacket>>(
    `SELECT t.id FROM app_tratativas t
     WHERE t.record_kind = 'BSOD' AND t.released_at IS NULL`,
  );

  const counts = {
    all: active.length,
    em_tratativa: 0,
    acionado: 0,
    validacao_pendente: 0,
    validacao_reprovada: 0,
    validado: 0,
  };

  if (active.length === 0) return counts;

  const ids = active.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const eventRows = await sirQuery<EventListRow[]>(
    `SELECT tratativa_id, event_type, note, created_at
     FROM app_tratativa_events
     WHERE tratativa_id IN (${placeholders})
       AND event_type IN (${WORKFLOW_EVENT_TYPES.map(() => "?").join(", ")})
     ORDER BY tratativa_id ASC, created_at ASC`,
    [...ids, ...WORKFLOW_EVENT_TYPES],
  );

  const eventsByTratativa = new Map<number, EventListRow[]>();
  for (const event of eventRows) {
    const list = eventsByTratativa.get(event.tratativa_id) ?? [];
    list.push(event);
    eventsByTratativa.set(event.tratativa_id, list);
  }

  for (const row of active) {
    const status = deriveTratativaChamadoStatus(eventsByTratativa.get(row.id) ?? []);
    if (status === "concluido") continue;
    counts[status] += 1;
  }

  return counts;
}

function emptyStatusCounts(): Record<TratativaChamadoStatusFilter, number> {
  return {
    all: 0,
    em_tratativa: 0,
    acionado: 0,
    validacao_pendente: 0,
    validacao_reprovada: 0,
    validado: 0,
    concluido: 0,
  };
}

function findEventTime(events: EventListRow[], eventType: string): string | null {
  const match = events.find((event) => event.event_type === eventType);
  return match ? normalizeDateTimeIso(match.created_at) : null;
}

/** Retorna o evento VALIDACAO mais recente da tratativa. */
function findLatestValidacao(events: EventListRow[]): EventListRow | null {
  let latest: EventListRow | null = null;
  for (const event of events) {
    if (event.event_type !== "VALIDACAO") continue;
    latest = event;
  }
  return latest;
}
