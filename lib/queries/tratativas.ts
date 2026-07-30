import type { RowDataPacket } from "mysql2";
import { getSirPool, sirExecute, sirQuery } from "@/lib/db/sir";
import type { AppUserRole } from "@/lib/models/app-user";
import { SIR_TABLES } from "@/lib/models";
import type {
  ActiveTratativaRecord,
  TratativaHistoryEntry,
  TratativaPublic,
  TratativaRecordKind,
} from "@/lib/models/tratativa";
import { getPmeBsodByMac } from "@/lib/queries/bsod";
import { isOpenSirRecord } from "@/lib/queries/sir";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type ActiveTratativaRow = ActiveTratativaRecord & RowDataPacket;
type SirStatusRow = RowDataPacket & { status: string | null };
type TratativaHistoryRow = RowDataPacket & {
  record_key: string;
  event_type: string;
  note: string | null;
  user_name: string;
  created_at: Date | string;
};

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

/** Registro SIR encerrado ou inexistente para novas ações. */
export class TratativaClosedError extends Error {
  constructor(message = "Somente registros abertos podem receber tratativa.") {
    super(message);
    this.name = "TratativaClosedError";
  }
}

/** Registro SIR indisponível para conclusão operacional. */
export class TratativaConclusionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TratativaConclusionError";
  }
}

/** Bloqueia novas ações quando o RAL/REC já está encerrado. */
async function assertOpenSirTarget(
  recordKind: TratativaRecordKind,
  recordKey: string,
): Promise<void> {
  if (recordKind !== "RAL" && recordKind !== "REC") return;
  if (!(await isOpenSirRecord(recordKind, recordKey))) {
    throw new TratativaClosedError();
  }
}

/** Confirma que o registro SIR existe e foi encerrado na fonte. */
async function assertClosedSirTarget(recordKind: "RAL" | "REC", recordKey: string): Promise<void> {
  const table = recordKind === "RAL" ? SIR_TABLES.rals : SIR_TABLES.recs;
  const rows = await sirQuery<SirStatusRow[]>(
    `SELECT status FROM ${table} WHERE num_recup = ? LIMIT 1`,
    [recordKey],
  );
  if (!rows[0]) {
    throw new TratativaConclusionError("Registro SIR não encontrado.");
  }
  if (
    String(rows[0].status ?? "")
      .trim()
      .toUpperCase() !== "ENCERRADO"
  ) {
    throw new TratativaConclusionError("Encerre a tratativa somente após o SIR normalizar.");
  }
}

/** Restringe novas tratativas BSOD a modems atualmente offline. */
async function assertStartableTarget(
  recordKind: TratativaRecordKind,
  recordKey: string,
): Promise<void> {
  if (recordKind === "BSOD") {
    const row = await getPmeBsodByMac(recordKey);
    if (String(row?.monitor_status) !== "0") {
      throw new TratativaClosedError("Somente modems offline podem iniciar tratativa.");
    }
    return;
  }
  await assertOpenSirTarget(recordKind, recordKey);
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

/** Conta tratativas ativas vinculadas a RALs e RECs ainda abertas. */
export async function countActiveSirTratativas(): Promise<number> {
  const rows = await sirQuery<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total
     FROM (
       SELECT t.id
       FROM app_tratativas t
       INNER JOIN ${SIR_TABLES.rals} r
         ON CONVERT(r.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
            t.record_key COLLATE utf8mb4_unicode_ci
       WHERE t.record_kind = 'RAL' AND t.released_at IS NULL AND r.status = 'ATIVO'
       UNION ALL
       SELECT t.id
       FROM app_tratativas t
       INNER JOIN ${SIR_TABLES.recs} r
         ON CONVERT(r.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
            t.record_key COLLATE utf8mb4_unicode_ci
       WHERE t.record_kind = 'REC' AND t.released_at IS NULL AND r.status = 'ATIVO'
     ) active_sir`,
  );
  return Number(rows[0]?.total ?? 0);
}

/** Conta tratativas ativas de RAL ou REC ainda aberta. */
export async function countActiveSirTratativasByKind(
  recordKind: Extract<TratativaRecordKind, "RAL" | "REC">,
): Promise<number> {
  const table = recordKind === "RAL" ? SIR_TABLES.rals : SIR_TABLES.recs;
  const rows = await sirQuery<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total
     FROM app_tratativas t
     INNER JOIN ${table} r
       ON CONVERT(r.num_recup USING utf8mb4) COLLATE utf8mb4_unicode_ci =
          t.record_key COLLATE utf8mb4_unicode_ci
     WHERE t.record_kind = ? AND t.released_at IS NULL AND r.status = 'ATIVO'`,
    [recordKind],
  );
  return Number(rows[0]?.total ?? 0);
}

/** Carrega eventos de auditoria agrupados por tratativa. */
async function listTratativaHistories(
  recordKind: TratativaRecordKind,
  recordKeys: string[],
): Promise<Record<string, TratativaHistoryEntry[]>> {
  if (recordKeys.length === 0) return {};
  const placeholders = recordKeys.map(() => "?").join(", ");
  const rows = await sirQuery<TratativaHistoryRow[]>(
    `SELECT e.record_key, e.event_type, e.note, e.created_at,
            u.name AS user_name
     FROM app_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.record_kind = ? AND e.record_key IN (${placeholders})
     ORDER BY e.created_at ASC, e.id ASC`,
    [recordKind, ...recordKeys],
  );
  return rows.reduce<Record<string, TratativaHistoryEntry[]>>((histories, row) => {
    const current = histories[row.record_key] ?? [];
    current.push({
      eventType: row.event_type,
      note: row.note,
      userName: row.user_name,
      createdAt: new Date(row.created_at).toISOString(),
    });
    histories[row.record_key] = current;
    return histories;
  }, {});
}

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

  const histories = await listTratativaHistories(
    recordKind,
    rows.map((row) => row.record_key),
  );
  return rows.map((row) => ({
    ...toTratativaPublic(row),
    history: histories[row.record_key] ?? [],
  }));
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
  await assertStartableTarget(input.recordKind, key);

  let insertId: number;
  try {
    const result = await sirExecute(
      `INSERT INTO app_tratativas (record_kind, record_key, user_id, note) VALUES (?, ?, ?, ?)`,
      [input.recordKind, key, input.userId, note],
    );
    insertId = result.insertId;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "ER_DUP_ENTRY") {
      const raced = await listActiveTratativas(input.recordKind, [key]);
      if (raced[0]?.userId === input.userId) return raced[0];
      if (raced[0]) throw new TratativaConflictError(raced[0]);
    }
    throw error;
  }

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, note)
     VALUES (?, ?, ?, 'START', ?, ?)`,
    [insertId, input.recordKind, key, input.userId, note],
  );

  const started = await listActiveTratativas(input.recordKind, [key]);
  if (!started[0]) {
    throw new Error("Falha ao registrar tratativa.");
  }
  return started[0];
}

/** Atualiza a observação da tratativa ativa e registra evento de auditoria. */
export async function updateTratativaObservation(input: {
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  note: string;
}): Promise<TratativaPublic> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const note = input.note.trim().slice(0, 500);
  if (!note) throw new Error("Informe a observação.");

  const rows = await sirQuery<ActiveTratativaRow[]>(
    `${ACTIVE_TRATATIVA_SELECT}
     AND t.record_kind = ? AND t.record_key = ?`,
    [input.recordKind, key],
  );
  const active = rows[0];
  if (!active) throw new TratativaRequiredError();
  if (input.userRole !== "STAFF" && active.user_id !== input.userId) {
    throw new TratativaForbiddenError();
  }

  await sirExecute(`UPDATE app_tratativas SET note = ? WHERE id = ? AND released_at IS NULL`, [
    note,
    active.id,
  ]);
  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, note)
     VALUES (?, ?, ?, 'OBSERVACAO', ?, ?)`,
    [active.id, input.recordKind, key, input.userId, note],
  );

  const updated = await listActiveTratativas(input.recordKind, [key]);
  if (!updated[0]) throw new TratativaNotFoundError();
  return updated[0];
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

/** Conclui tratativa RAL/REC já encerrada na fonte e registra auditoria. */
export async function concludeSirTratativa(input: {
  recordKind: "RAL" | "REC";
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  note: string;
}): Promise<void> {
  const key = normalizeTratativaKey(input.recordKind, input.recordKey);
  const note = input.note.trim().slice(0, 500);
  if (!note) throw new TratativaConclusionError("Informe a observação de encerramento.");
  await assertClosedSirTarget(input.recordKind, key);

  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<Array<{ id: number; user_id: number } & RowDataPacket>>(
      `SELECT id, user_id FROM app_tratativas
       WHERE record_kind = ? AND record_key = ? AND released_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [input.recordKind, key],
    );
    const active = rows[0];
    if (!active) throw new TratativaNotFoundError();
    if (input.userRole !== "STAFF" && active.user_id !== input.userId) {
      throw new TratativaForbiddenError();
    }

    await connection.execute(
      `INSERT INTO app_tratativa_events
         (tratativa_id, record_kind, record_key, event_type, user_id, note)
       VALUES (?, ?, ?, 'CONCLUIDA', ?, ?)`,
      [active.id, input.recordKind, key, input.userId, note],
    );
    await connection.execute(
      `UPDATE app_tratativas SET released_at = NOW(), released_by = ?
       WHERE id = ? AND released_at IS NULL`,
      [input.userId, active.id],
    );
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

  await assertOpenSirTarget(input.recordKind, key);

  await sirExecute(
    `INSERT INTO app_tratativa_events
       (tratativa_id, record_kind, record_key, event_type, user_id, message_text)
     VALUES (?, ?, ?, 'ACIONAMENTO', ?, ?)`,
    [active.id, input.recordKind, key, input.userId, input.messageText],
  );
}
