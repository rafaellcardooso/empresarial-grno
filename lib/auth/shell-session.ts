import { APP_TOUR_VERSION } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import type { AppTheme } from "@/lib/auth/theme";
import type { AppUserRole, AppUserStatus } from "@/lib/models/app-user";
import { countPendingUsers, getUserSettings } from "@/lib/queries/app-users";
import { countUnreadNotifications } from "@/lib/queries/notifications";

/** Usuário resumido para o shell (navbar/sidebar). */
export type ShellUser = {
  id: number;
  corporateId: string;
  name: string;
  role: AppUserRole;
  status: AppUserStatus;
};

/** Dados de sessão carregados uma vez no layout autenticado. */
export type ShellSessionData = {
  user: ShellUser;
  unreadNotifications: number;
  pendingUsersCount: number;
  theme: AppTheme;
  tourShouldRun: boolean;
};

/** Carrega contexto do shell no servidor (uma query batch por request). */
export async function loadShellSession(): Promise<ShellSessionData | null> {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return null;
  }

  const [unreadNotifications, settings, pendingUsersCount] = await Promise.all([
    countUnreadNotifications(session.userId),
    getUserSettings(session.userId),
    session.role === "STAFF" ? countPendingUsers() : Promise.resolve(0),
  ]);

  return {
    user: {
      id: session.userId,
      corporateId: session.corporateId,
      name: session.name,
      role: session.role,
      status: session.status,
    },
    unreadNotifications,
    pendingUsersCount,
    theme: settings.theme,
    tourShouldRun: settings.tourCompletedVersion < APP_TOUR_VERSION,
  };
}
