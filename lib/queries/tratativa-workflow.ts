import type { RowDataPacket } from "mysql2";
import { getSirPool, sirExecute, sirQuery } from "@/lib/db/sir";
import type { AppUserRole } from "@/lib/models/app-user";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import { parseValidacaoOutcomeFromNote } from "@/lib/config/tratativa-workflow";
import type {
  TratativaPublic,
  TratativaRecordKind,
  TratativaWorkflowStatus,
} from "@/lib/models/tratativa";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";
import {
  formatValidacaoFcaMessage,
  getValidacaoFcaValidationError,
} from "@/lib/tratativa/validate-validacao-fca";
import { TratativaForbiddenError, TratativaRequiredError } from "@/lib/queries/tratativas";

type WorkflowEventRow = RowDataPacket & {
  tratativa_id: number;
  event_type: string;
  note: string | null;
};

type WorkflowEvent = {
  event_type: string;
  note?: string | null;
};

const WORKFLOW_EVENT_TYPES = [
  "ACIONAMENTO",
  "VALIDACAO_SOLICITADA",
  "VALIDACAO",
  "CONCLUIDA",
] as const;

const ACTIVE_TRATATIVA_LOOKUP = `
  SELECT t.id, t.user_id
  FROM app_tratativas t
  WHERE t.released_at IS NULL
    AND t.record_kind = ?
    AND t.record_key = ?
  LIMIT 1
`;

/** Fase incorreta para a ação solicitada no fluxo BSOD. */
export class TratativaWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TratativaWorkflowError";
  }
}

/** Restringe validação/conclusão ao domínio BSOD. */
function assertBsodWorkflow(recordKind: TratativaRecordKind): void {
  if (recordKind !== "BSOD") {
    throw new TratativaWorkflowError("Fluxo de validação disponível somente para BSOD.");
  }
}

/** Deriva fase operacional a partir da sequência de eventos da tratativa. */
export function deriveTratativaWorkflowStatus(events: WorkflowEvent[]): TratativaWorkflowStatus {
  let status: TratativaWorkflowStatus = "em_tratativa";
  for (const event of events) {
    if (event.event_type === "ACIONAMENTO") status = "acionado";
    if (event.event_type === "VALIDACAO_SOLICITADA") status = "validacao_pendente";
    if (event.event_type === "VALIDACAO") {
      const outcome = parseValidacaoOutcomeFromNote(event.note);
      status = outcome === "aprovada" ? "validado" : "validacao_reprovada";
    }
  }
  return status;
}

/** Anexa workflowStatus às tratativas BSOD para exibição na UI. */
export async function enrichTratativasWorkflow(
  tratativas: Record<string, TratativaPublic>,
): Promise<Record<string, TratativaPublic>> {
  const items = Object.values(tratativas).filter((item) => item.recordKind === "BSOD");
  if (items.length === 0) return tratativas;

  const ids = items.map((item) => item.id);
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await sirQuery<WorkflowEventRow[]>(
    `SELECT tratativa_id, event_type, note
     FROM app_tratativa_events
     WHERE tratativa_id IN (${placeholders})
       AND event_type IN (${WORKFLOW_EVENT_TYPES.map(() => "?").join(", ")})
     ORDER BY tratativa_id ASC, created_at ASC, id ASC`,
    [...ids, ...WORKFLOW_EVENT_TYPES],
  );

  const eventsByTratativa = new Map<number, WorkflowEvent[]>();
  for (const row of rows) {
    const list = eventsByTratativa.get(row.tratativa_id) ?? [];
    list.push({ event_type: row.event_type, note: row.note });
    eventsByTratativa.set(row.tratativa_id, list);
  }

  const enriched = { ...tratativas };
  for (const item of items) {
    const events = eventsByTratativa.get(item.id) ?? [];
    enriched[item.recordKey] = {
      ...item,
      workflowStatus: deriveTratativaWorkflowStatus(events),
    };
  }

  return enriched;
}

/** Carrega tratativa ativa, permissões e fase do fluxo BSOD. */
async function getActiveTratativaForWorkflow(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
}): Promise<{ id: number; workflowStatus: TratativaWorkflowStatus }> {
  assertBsodWorkflow(input.recordKind);
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const [active] = await sirQuery<Array<{ id: number; user_id: number } & RowDataPacket>>(
    ACTIVE_TRATATIVA_LOOKUP,
    [input.recordKind, key],
  );

  if (!active) {
    throw new TratativaRequiredError();
  }

  const canManage = input.userRole === "STAFF" || active.user_id === input.userId;
  if (!canManage) {
    throw new TratativaForbiddenError();
  }

  const eventRows = await sirQuery<WorkflowEventRow[]>(
    `SELECT event_type, note FROM app_tratativa_events
     WHERE tratativa_id = ?
       AND event_type IN (${WORKFLOW_EVENT_TYPES.map(() => "?").join(", ")})
     ORDER BY created_at ASC, id ASC`,
    [active.id, ...WORKFLOW_EVENT_TYPES],
  );

  return {
    id: active.id,
    workflowStatus: deriveTratativaWorkflowStatus(eventRows),
  };
}

/** Registra que o técnico solicitou validação ao acionador. */
export async function requestValidacao(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const active = await getActiveTratativaForWorkflow(input);

  if (active.workflowStatus !== "acionado" && active.workflowStatus !== "validacao_reprovada") {
    throw new TratativaWorkflowError("Registre o pedido do técnico somente após acionar VT.");
  }

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id)
     VALUES (?, ?, ?, 'VALIDACAO_SOLICITADA', ?)`,
    [active.id, input.recordKind, key, input.userId],
  );
}

/** Registra resultado da validação pós-VT com FCA. */
export async function recordValidacao(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  outcome: "aprovada" | "reprovada";
  fca: ValidacaoFcaInput;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const active = await getActiveTratativaForWorkflow(input);

  if (active.workflowStatus !== "validacao_pendente") {
    throw new TratativaWorkflowError("Registre validação somente com solicitação pendente.");
  }

  const fcaError = getValidacaoFcaValidationError(input.fca);
  if (fcaError) {
    throw new TratativaWorkflowError(fcaError);
  }

  const messageText = formatValidacaoFcaMessage(input.fca);

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, note, message_text)
     VALUES (?, ?, ?, 'VALIDACAO', ?, ?, ?)`,
    [active.id, input.recordKind, key, input.userId, input.outcome, messageText],
  );
}

/** Marca tratativa BSOD como concluída e encerra assunção. */
export async function concludeTratativa(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  note?: string | null;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const active = await getActiveTratativaForWorkflow(input);

  if (active.workflowStatus !== "validado") {
    throw new TratativaWorkflowError("Conclua somente após validação aprovada.");
  }

  const note = input.note?.trim() ? input.note.trim().slice(0, 500) : null;
  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO app_tratativa_events
         (tratativa_id, record_kind, record_key, event_type, user_id, note)
       VALUES (?, ?, ?, 'CONCLUIDA', ?, ?)`,
      [active.id, input.recordKind, key, input.userId, note],
    );
    const [result] = await connection.execute(
      `UPDATE app_tratativas
       SET released_at = NOW(), released_by = ?
       WHERE id = ? AND released_at IS NULL`,
      [input.userId, active.id],
    );
    if ("affectedRows" in result && result.affectedRows === 0) {
      throw new TratativaWorkflowError("Tratativa já liberada por outro processo.");
    }
    await connection.execute(
      `INSERT INTO app_tratativa_events
         (tratativa_id, record_kind, record_key, event_type, user_id)
       VALUES (?, ?, ?, 'RELEASE', ?)`,
      [active.id, input.recordKind, key, input.userId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
