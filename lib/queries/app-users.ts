import type { RowDataPacket } from "mysql2/promise";
import { normalizeCorporateId } from "@/lib/auth/validation";
import { sirExecute, sirQuery } from "@/lib/db/sir";
import type { AppUserPublic, AppUserRecord, AppUserStatus } from "@/lib/models/app-user";

type UserRow = AppUserRecord & RowDataPacket;

const USER_SELECT = `
  id, corporate_id, email, name, password_hash, role, status,
  created_at, updated_at, approved_by, approved_at
`;

/** Converte registro DB para objeto público (sem senha). */
export function toPublicUser(row: AppUserRecord): AppUserPublic {
  return {
    id: row.id,
    corporateId: row.corporate_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    created_at: row.created_at.toISOString(),
    approved_at: row.approved_at ? row.approved_at.toISOString() : null,
  };
}

/** Busca usuário por matrícula corporativa (login). */
export async function getUserByCorporateId(corporateId: string): Promise<AppUserRecord | null> {
  const rows = await sirQuery<UserRow[]>(
    `SELECT ${USER_SELECT} FROM app_users WHERE corporate_id = ? LIMIT 1`,
    [normalizeCorporateId(corporateId)],
  );
  return rows[0] ?? null;
}

/** Busca usuário por ID. */
export async function getUserById(id: number): Promise<AppUserRecord | null> {
  const rows = await sirQuery<UserRow[]>(
    `SELECT ${USER_SELECT} FROM app_users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Cria conta pendente de aprovação. */
export async function createPendingUser(input: {
  corporateId: string;
  name: string;
  passwordHash: string;
  email?: string | null;
}): Promise<number> {
  const result = await sirExecute(
    `INSERT INTO app_users (corporate_id, email, name, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'USER', 'PENDING')`,
    [
      normalizeCorporateId(input.corporateId),
      input.email?.trim().toLowerCase() || null,
      input.name.trim(),
      input.passwordHash,
    ],
  );
  return result.insertId;
}

/** Lista usuários pendentes de aprovação. */
export async function listPendingUsers(): Promise<AppUserPublic[]> {
  const rows = await sirQuery<UserRow[]>(
    `SELECT ${USER_SELECT} FROM app_users WHERE status = 'PENDING' ORDER BY created_at ASC`,
  );
  return rows.map(toPublicUser);
}

/** Lista todos os usuários (staff). */
export async function listAllUsers(): Promise<AppUserPublic[]> {
  const rows = await sirQuery<UserRow[]>(
    `SELECT ${USER_SELECT} FROM app_users ORDER BY created_at DESC`,
  );
  return rows.map(toPublicUser);
}

/** Atualiza status da conta (aprovação/rejeição/suspensão). */
export async function updateUserStatus(
  userId: number,
  status: AppUserStatus,
  approvedBy: number | null,
): Promise<void> {
  await sirQuery(
    `UPDATE app_users
     SET status = ?, approved_by = ?, approved_at = CASE WHEN ? = 'ACTIVE' THEN NOW() ELSE approved_at END
     WHERE id = ?`,
    [status, approvedBy, status, userId],
  );
}

/** Atualiza hash de senha. */
export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await sirQuery(`UPDATE app_users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
}

/** Verifica se matrícula já está em uso por outro usuário. */
export async function isCorporateIdTaken(
  corporateId: string,
  excludeUserId?: number,
): Promise<boolean> {
  const normalized = normalizeCorporateId(corporateId);
  const rows = await sirQuery<RowDataPacket[]>(
    excludeUserId
      ? `SELECT id FROM app_users WHERE corporate_id = ? AND id != ? LIMIT 1`
      : `SELECT id FROM app_users WHERE corporate_id = ? LIMIT 1`,
    excludeUserId ? [normalized, excludeUserId] : [normalized],
  );
  return rows.length > 0;
}

/** Atualiza dados cadastrais do usuário. */
export async function updateUserProfile(
  userId: number,
  input: { corporateId?: string; name?: string; email?: string | null },
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.corporateId !== undefined) {
    sets.push("corporate_id = ?");
    params.push(normalizeCorporateId(input.corporateId));
  }
  if (input.name !== undefined) {
    sets.push("name = ?");
    params.push(input.name.trim());
  }
  if (input.email !== undefined) {
    sets.push("email = ?");
    params.push(input.email?.trim().toLowerCase() || null);
  }

  if (sets.length === 0) {
    return;
  }

  params.push(userId);
  await sirQuery(`UPDATE app_users SET ${sets.join(", ")} WHERE id = ?`, params);
}

/** Remove usuário (CASCADE em tabelas relacionadas). */
export async function deleteUser(userId: number): Promise<void> {
  await sirQuery(`DELETE FROM app_users WHERE id = ?`, [userId]);
}

/** Conta staff ativos excluindo um ID (proteção ao excluir staff). */
export async function countActiveStaffExcept(userId: number): Promise<number> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM app_users WHERE role = 'STAFF' AND status = 'ACTIVE' AND id != ?`,
    [userId],
  );
  return Number(rows[0]?.cnt ?? 0);
}

/** Garante registro de preferências do usuário. */
export async function ensureUserSettings(userId: number): Promise<void> {
  await sirQuery(
    `INSERT IGNORE INTO app_user_settings (user_id, tour_completed_version) VALUES (?, 0)`,
    [userId],
  );
}

/** Preferências do usuário (tema + tour) em uma única leitura. */
export async function getUserSettings(userId: number): Promise<{
  theme: "light" | "dark";
  tourCompletedVersion: number;
}> {
  await ensureUserSettings(userId);
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT theme, tour_completed_version FROM app_user_settings WHERE user_id = ?`,
    [userId],
  );
  return {
    theme: rows[0]?.theme === "dark" ? "dark" : "light",
    tourCompletedVersion: Number(rows[0]?.tour_completed_version ?? 0),
  };
}

/** Retorna versão do tour concluída pelo usuário. */
export async function getTourCompletedVersion(userId: number): Promise<number> {
  const settings = await getUserSettings(userId);
  return settings.tourCompletedVersion;
}

/** Marca tour como concluído para a versão informada. */
export async function markTourCompleted(userId: number, version: number): Promise<void> {
  await ensureUserSettings(userId);
  await sirQuery(
    `UPDATE app_user_settings SET tour_completed_version = ? WHERE user_id = ?`,
    [version, userId],
  );
}

/** Retorna tema preferido do usuário. */
export async function getUserThemePreference(userId: number): Promise<"light" | "dark"> {
  const settings = await getUserSettings(userId);
  return settings.theme;
}

/** Persiste tema preferido do usuário. */
export async function setUserThemePreference(
  userId: number,
  theme: "light" | "dark",
): Promise<void> {
  await ensureUserSettings(userId);
  await sirQuery(`UPDATE app_user_settings SET theme = ? WHERE user_id = ?`, [theme, userId]);
}

/** Conta staff ativos (bootstrap check). */
export async function countActiveStaff(): Promise<number> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM app_users WHERE role = 'STAFF' AND status = 'ACTIVE'`,
  );
  return Number(rows[0]?.cnt ?? 0);
}

/** Cria usuário staff ativo (uso interno / testes). */
export async function createStaffUser(input: {
  corporateId: string;
  name: string;
  passwordHash: string;
  email?: string | null;
}): Promise<number> {
  const result = await sirExecute(
    `INSERT INTO app_users (corporate_id, email, name, password_hash, role, status, approved_at)
     VALUES (?, ?, ?, ?, 'STAFF', 'ACTIVE', NOW())`,
    [
      normalizeCorporateId(input.corporateId),
      input.email?.trim().toLowerCase() || null,
      input.name.trim(),
      input.passwordHash,
    ],
  );
  return result.insertId;
}

/** Lista IDs de staff ativos. */
export async function listActiveStaffUserIds(): Promise<number[]> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT id FROM app_users WHERE role = 'STAFF' AND status = 'ACTIVE'`,
  );
  return rows.map((row) => Number(row.id));
}

/** Conta cadastros pendentes de aprovação. */
export async function countPendingUsers(): Promise<number> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM app_users WHERE status = 'PENDING'`,
  );
  return Number(rows[0]?.cnt ?? 0);
}

/** Lista IDs de usuários ativos (broadcast). */
export async function listActiveUserIds(): Promise<number[]> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT id FROM app_users WHERE status = 'ACTIVE'`,
  );
  return rows.map((row) => Number(row.id));
}
