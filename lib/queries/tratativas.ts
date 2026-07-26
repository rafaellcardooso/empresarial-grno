import type { RowDataPacket } from "mysql2";
import { sirExecute, sirQuery } from "@/lib/db/sir";
import type { AppUserRole } from "@/lib/models/app-user";
import type {
  ActiveTratativaRecord,
  TratativaPublic,
  TratativaRecordKind,
} from "@/lib/models/tratativa";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type ActiveTratativaRow = ActiveTratativaRecord & RowDataPacket;

/** Conflito quando o registro já possui tratativa ativa de outro usuário. */
export class TratativaConflictError extends Error {
  readonly existing: TratativaPublic;

  constructor(existing: TratativaPublic) {
    super("Registro já em tratativa por outro usuário.");
    this.name = "TratativaConflictError";
    this.existing = existing;
  }
}

/** Nenhuma tratativa ativa para liberar. */
export class TratativaNotFoundError extends Error {
  constructor() {
    super("Nenhuma tratativa ativa para este registro.");
    this.name = "TratativaNotFoundError";
  }
}

/** Usuário sem permissão para liberar tratativa alheia. */
export class TratativaForbiddenError extends Error {
  constructor() {
    super("Sem permissão para liberar esta tratativa.");
    this.name = "TratativaForbiddenError";
  }
}

/** Tratativa ativa ausente ao registrar acionamento. */
export class TratativaRequiredError extends Error {
  constructor() {
    super("Assuma a tratativa antes de acionar.");
    this.name = "TratativaRequiredError";
  }
}

/** Converte linha do banco para payload público. */
function toTratativaPublic(row: ActiveTratativaRecord): TratativaPublic {
  return {
    id: row.id,
    recordKind: row.record_kind,
    recordKey: row.record_key,
    userId: row.user_id,
    userName: row.user_name,
    userCorporateId: row.user_corporate_id,
    note: row.note,
    startedAt: row.started_at.toISOString(),
  };
}

const ACTIVE_TRATATIVA_SELECT = `
  SELECT t.id, t.record_kind, t.record_key, t.user_id, t.note, t.started_at,
         u.name AS user_name, u.corporate_id AS user_corporate_id
  FROM app_tratativas t
  INNER JOIN app_users u ON u.id = t.user_id
  WHERE t.released_at IS NULL
`;

/** Lista tratativas ativas para um conjunto de chaves. */
export async function listActiveTratativas(
  recordKind: TratativaRecordKind,
  recordKeys: string[],
): Promise<TratativaPublic[]> {
  const normalized = [
    ...new Set(recordKeys.map((key) => normalizeTratativaKey(recordKind, key))),
  ].filter(Boolean);
  if (normalized.length === 0) return [];

  const placeholders = normalized.map(() => "?").join(", ");
  const rows = await sirQuery<ActiveTratativaRow[]>(
    `${ACTIVE_TRATATIVA_SELECT}
     AND t.record_kind = ? AND t.record_key IN (${placeholders})`,
    [recordKind, ...normalized],
  );

  return rows.map(toTratativaPublic);
}

/** Mapa record_key → tratativa ativa. */
export async function mapActiveTratativas(
  recordKind: TratativaRecordKind,
  recordKeys: string[],
): Promise<Record<string, TratativaPublic>> {
  const items = await listActiveTratativas(recordKind, recordKeys);
  return Object.fromEntries(items.map((item) => [item.recordKey, item]));
}

/** Registra assunção de tratativa (idempotente para o mesmo usuário). */
export async function startTratativa(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  note?: string | null;
}): Promise<TratativaPublic> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  if (!key) {
    throw new Error("Chave de registro inválida.");
  }

  const note = input.note?.trim() ? input.note.trim().slice(0, 500) : null;
  const existing = await listActiveTratativas(input.recordKind, [key]);
  if (existing.length > 0) {
    if (existing[0].userId === input.userId) return existing[0];
    throw new TratativaConflictError(existing[0]);
  }

  const result = await sirExecute(
    `INSERT INTO app_tratativas (record_kind, record_key, user_id, note) VALUES (?, ?, ?, ?)`,
    [input.recordKind, key, input.userId, note],
  );

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, note)
     VALUES (?, ?, ?, 'START', ?, ?)`,
    [result.insertId, input.recordKind, key, input.userId, note],
  );

  const started = await listActiveTratativas(input.recordKind, [key]);
  if (!started[0]) {
    throw new Error("Falha ao registrar tratativa.");
  }
  return started[0];
}

/** Encerra tratativa ativa e grava evento RELEASE. */
export async function releaseTratativa(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const rows = await sirQuery<ActiveTratativaRow[]>(
    `${ACTIVE_TRATATIVA_SELECT}
     AND t.record_kind = ? AND t.record_key = ?`,
    [input.recordKind, key],
  );

  const active = rows[0];
  if (!active) {
    throw new TratativaNotFoundError();
  }

  const canRelease = input.userRole === "STAFF" || active.user_id === input.userId;
  if (!canRelease) {
    throw new TratativaForbiddenError();
  }

  await sirExecute(
    `UPDATE app_tratativas
     SET released_at = NOW(), released_by = ?
     WHERE id = ? AND released_at IS NULL`,
    [input.userId, active.id],
  );

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id)
     VALUES (?, ?, ?, 'RELEASE', ?)`,
    [active.id, input.recordKind, key, input.userId],
  );
}

/** Registra acionamento WhatsApp vinculado à tratativa ativa. */
export async function recordAcionamento(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  messageText: string;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const rows = await sirQuery<ActiveTratativaRow[]>(
    `${ACTIVE_TRATATIVA_SELECT}
     AND t.record_kind = ? AND t.record_key = ?`,
    [input.recordKind, key],
  );

  const active = rows[0];
  if (!active) {
    throw new TratativaRequiredError();
  }

  const canAcionar = input.userRole === "STAFF" || active.user_id === input.userId;
  if (!canAcionar) {
    throw new TratativaForbiddenError();
  }

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, message_text)
     VALUES (?, ?, ?, 'ACIONAMENTO', ?, ?)`,
    [active.id, input.recordKind, key, input.userId, input.messageText],
  );
}
