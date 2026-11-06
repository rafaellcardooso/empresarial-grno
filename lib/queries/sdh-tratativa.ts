import type { AppUserRole } from "@/lib/models/app-user";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import { getSirPool, sirQuery } from "@/lib/db/sir";
import { serializeRows } from "@/lib/serialize";
import type { RowDataPacket } from "mysql2";

/** Alarme SDH ainda ativo — conclusão com FCA só após normalização no TMIP. */
export class SdhTratativaConclusionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SdhTratativaConclusionError";
  }
}

/** Sem ownership/STAFF para concluir tratativa SDH. */
export class SdhTratativaForbiddenError extends Error {
  constructor(message = "Sem permissão para concluir esta tratativa.") {
    super(message);
    this.name = "SdhTratativaForbiddenError";
  }
}

type MarkSdhStatusInput = {
  id: number;
  emTratativa: boolean;
  userId: number;
  userRole?: AppUserRole;
  observacao?: string | null;
  /** `claim` só assume alarmes livres; `update` exige ownership (ou STAFF). */
  mode?: "claim" | "update" | "close";
};

type SdhRow = RowDataPacket & SdhAlarmListItem;

/** Concorrência de assunção SDH — alarme já sob outro responsável. */
export class SdhTratativaConflictError extends Error {
  constructor(
    public readonly ownerLogin: string | null,
    public readonly ownerName: string | null = null,
  ) {
    const who =
      [ownerName, ownerLogin]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" · ") || "outro usuário";
    super(`Em tratativa por ${who}.`);
    this.name = "SdhTratativaConflictError";
  }
}

/** Lê alarme por id para checagem pós-update (ativo ou inativo). */
async function readAlarm(id: number): Promise<SdhAlarmListItem | null> {
  const rows = await sirQuery<SdhRow[]>(
    `SELECT a.*, u.corporate_id AS tratativa_user_login, u.name AS tratativa_user_name
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] ? (serializeRows(rows)[0] as SdhAlarmListItem) : null;
}

/** Registra atualização cronológica e altera o responsável/status da tratativa SDH. */
export async function updateSdhTratativaStatus(
  input: MarkSdhStatusInput,
): Promise<SdhAlarmListItem | null> {
  const observacao = input.observacao?.trim();
  if (!observacao) {
    throw new Error("Observação obrigatória para atualizar a tratativa.");
  }

  const mode = input.mode ?? (input.emTratativa ? "update" : "close");
  const isStaff = input.userRole === "STAFF";

  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();

    let sql: string;
    let params: Array<string | number>;

    if (mode === "claim") {
      sql = `UPDATE sdh_alarms
         SET em_tratativa = 1,
             tratativa_user_id = ?,
             tratativa_marked_at = NOW(),
             tratativa_observacao = ?
         WHERE id = ? AND is_active = 1 AND em_tratativa = 0`;
      params = [input.userId, observacao, input.id];
    } else if (mode === "close") {
      sql = `UPDATE sdh_alarms
         SET em_tratativa = 0,
             tratativa_user_id = NULL,
             tratativa_marked_at = NOW(),
             tratativa_observacao = ?
         WHERE id = ? AND em_tratativa = 1
           AND (tratativa_user_id = ? OR ? = 1)`;
      params = [observacao, input.id, input.userId, isStaff ? 1 : 0];
    } else {
      sql = `UPDATE sdh_alarms
         SET em_tratativa = 1,
             tratativa_user_id = COALESCE(tratativa_user_id, ?),
             tratativa_marked_at = NOW(),
             tratativa_observacao = ?
         WHERE id = ? AND em_tratativa = 1
           AND (tratativa_user_id = ? OR ? = 1)`;
      params = [input.userId, observacao, input.id, input.userId, isStaff ? 1 : 0];
    }

    const [result] = await connection.execute(sql, params);
    if ("affectedRows" in result && result.affectedRows === 0) {
      await connection.rollback();
      if (mode === "claim") {
        const current = await readAlarm(input.id);
        if (current && Number(current.em_tratativa) === 1) {
          throw new SdhTratativaConflictError(
            current.tratativa_user_login ?? null,
            current.tratativa_user_name ?? null,
          );
        }
      }
      return null;
    }

    const eventType = mode === "close" ? "CLOSE" : mode === "claim" ? "START" : "OBSERVACAO";
    await connection.execute(
      `INSERT INTO sdh_tratativa_events
         (alarm_id, user_id, event_type, observacao)
       VALUES (?, ?, ?, ?)`,
      [input.id, input.userId, eventType, observacao],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return readAlarm(input.id);
}

/**
 * Conclui tratativa SDH de alarme já normalizado (is_active=0),
 * gravando FCA no evento CLOSE.
 */
export async function concludeSdhTratativa(input: {
  alarmId: number;
  userId: number;
  userRole: AppUserRole;
  messageText: string;
  note?: string | null;
}): Promise<SdhAlarmListItem> {
  const messageText = input.messageText.trim();
  if (!messageText) {
    throw new SdhTratativaConclusionError("FCA obrigatório para concluir a tratativa.");
  }

  const isStaff = input.userRole === "STAFF";
  const note = input.note?.trim();
  const observacao = note ? `${messageText}\n\n${note}` : messageText;

  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<SdhRow[]>(
      `SELECT a.*, u.corporate_id AS tratativa_user_login, u.name AS tratativa_user_name
       FROM sdh_alarms a
       LEFT JOIN app_users u ON u.id = a.tratativa_user_id
       WHERE a.id = ?
       LIMIT 1
       FOR UPDATE`,
      [input.alarmId],
    );
    const alarm = rows[0];
    if (!alarm) {
      throw new SdhTratativaConclusionError("Alarme SDH não encontrado.");
    }
    if (Number(alarm.em_tratativa) !== 1) {
      throw new SdhTratativaConclusionError("Alarme SDH sem tratativa ativa.");
    }
    if (Number(alarm.is_active) === 1) {
      throw new SdhTratativaConclusionError(
        "Conclua somente após o alarme ser normalizado no TMIP.",
      );
    }
    if (!isStaff && alarm.tratativa_user_id !== input.userId) {
      throw new SdhTratativaForbiddenError();
    }

    const [result] = await connection.execute(
      `UPDATE sdh_alarms
       SET em_tratativa = 0,
           tratativa_user_id = NULL,
           tratativa_marked_at = NOW(),
           tratativa_observacao = ?
       WHERE id = ? AND em_tratativa = 1
         AND (tratativa_user_id = ? OR ? = 1)`,
      [observacao, input.alarmId, input.userId, isStaff ? 1 : 0],
    );
    if ("affectedRows" in result && result.affectedRows === 0) {
      throw new SdhTratativaForbiddenError();
    }

    await connection.execute(
      `INSERT INTO sdh_tratativa_events
         (alarm_id, user_id, event_type, observacao)
       VALUES (?, ?, 'CLOSE', ?)`,
      [input.alarmId, input.userId, observacao],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const closed = await readAlarm(input.alarmId);
  if (!closed) {
    throw new SdhTratativaConclusionError("Alarme SDH não encontrado após conclusão.");
  }
  return closed;
}
