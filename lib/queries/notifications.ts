import type { RowDataPacket } from "mysql2/promise";
import { sirExecute, sirQuery } from "@/lib/db/sir";
import { listActiveStaffUserIds } from "@/lib/queries/app-users";
import type { AppNotificationRecord, UserNotificationRecord } from "@/lib/models/notification";

type NotificationRow = AppNotificationRecord & RowDataPacket;

type UserNotificationRow = UserNotificationRecord & RowDataPacket;

/** Cria rascunho de notificação (ainda não enviada). */
export async function createNotification(input: {
  title: string;
  body: string;
  createdBy: number;
}): Promise<number> {
  const result = await sirExecute(
    `INSERT INTO app_notifications (title, body, created_by) VALUES (?, ?, ?)`,
    [input.title.trim(), input.body.trim(), input.createdBy],
  );
  return result.insertId;
}

/** Lista notificações criadas (staff). */
export async function listStaffNotifications(): Promise<AppNotificationRecord[]> {
  return sirQuery<NotificationRow[]>(
    `SELECT id, title, body, created_by, created_at, sent_at
     FROM app_notifications ORDER BY created_at DESC`,
  );
}

/** Busca notificação por ID. */
export async function getNotificationById(id: number): Promise<AppNotificationRecord | null> {
  const rows = await sirQuery<NotificationRow[]>(
    `SELECT id, title, body, created_by, created_at, sent_at FROM app_notifications WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/** Dispara notificação para usuários específicos. */
export async function deliverNotificationToUsers(
  notificationId: number,
  userIds: number[],
): Promise<number> {
  if (userIds.length === 0) return 0;

  const values = userIds.map((userId) => [userId, notificationId]);
  const placeholders = values.map(() => "(?, ?)").join(", ");

  await sirQuery(
    `INSERT IGNORE INTO app_user_notifications (user_id, notification_id) VALUES ${placeholders}`,
    values.flat(),
  );

  return userIds.length;
}

/** Marca notificação como enviada. */
export async function markNotificationSent(notificationId: number): Promise<void> {
  await sirQuery(`UPDATE app_notifications SET sent_at = NOW() WHERE id = ?`, [notificationId]);
}

/** Notifica todos os staff ativos (ex.: nova solicitação de acesso). */
export async function notifyActiveStaff(title: string, body: string): Promise<void> {
  const staffIds = await listActiveStaffUserIds();
  if (staffIds.length === 0) return;

  const notificationId = await createNotification({
    title,
    body,
    createdBy: staffIds[0],
  });

  await deliverNotificationToUsers(notificationId, staffIds);
  await markNotificationSent(notificationId);
}

/** Dispara notificação para todos os usuários ativos. */
export async function sendNotificationToAllUsers(notificationId: number): Promise<number> {
  const notification = await getNotificationById(notificationId);
  if (!notification) throw new Error("Notificação não encontrada");
  if (notification.sent_at) throw new Error("Notificação já enviada");

  const userIds = await sirQuery<RowDataPacket[]>(
    `SELECT id FROM app_users WHERE status = 'ACTIVE'`,
  );

  const ids = userIds.map((row) => Number(row.id));
  if (ids.length === 0) {
    await markNotificationSent(notificationId);
    return 0;
  }

  await deliverNotificationToUsers(notificationId, ids);
  await markNotificationSent(notificationId);
  return ids.length;
}

/** Lista notificações do usuário. */
export async function listUserNotifications(userId: number): Promise<UserNotificationRecord[]> {
  return sirQuery<UserNotificationRow[]>(
    `SELECT
       n.id AS notification_id,
       n.title,
       n.body,
       n.created_at,
       n.sent_at,
       un.delivered_at,
       un.read_at
     FROM app_user_notifications un
     INNER JOIN app_notifications n ON n.id = un.notification_id
     WHERE un.user_id = ?
     ORDER BY un.delivered_at DESC`,
    [userId],
  );
}

/** Conta notificações não lidas. */
export async function countUnreadNotifications(userId: number): Promise<number> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM app_user_notifications WHERE user_id = ? AND read_at IS NULL`,
    [userId],
  );
  return Number(rows[0]?.cnt ?? 0);
}

/** Marca notificação como lida. */
export async function markNotificationRead(userId: number, notificationId: number): Promise<void> {
  await sirQuery(
    `UPDATE app_user_notifications SET read_at = NOW()
     WHERE user_id = ? AND notification_id = ? AND read_at IS NULL`,
    [userId, notificationId],
  );
}

/** Marca todas as notificações como lidas. */
export async function markAllNotificationsRead(userId: number): Promise<void> {
  await sirQuery(
    `UPDATE app_user_notifications SET read_at = NOW()
     WHERE user_id = ? AND read_at IS NULL`,
    [userId],
  );
}

/** Cria token de reset de senha. */
export async function createPasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await sirQuery(
    `UPDATE app_password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`,
    [userId],
  );
  await sirQuery(
    `INSERT INTO app_password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
}

/** Valida token de reset e retorna user_id. */
export async function consumePasswordResetToken(tokenHash: string): Promise<number | null> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT id, user_id FROM app_password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;

  await sirQuery(`UPDATE app_password_reset_tokens SET used_at = NOW() WHERE id = ?`, [row.id]);
  return Number(row.user_id);
}
