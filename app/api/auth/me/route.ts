import { NextResponse } from "next/server";
import { APP_TOUR_VERSION } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { countPendingUsers, getUserSettings } from "@/lib/queries/app-users";
import { countUnreadNotifications } from "@/lib/queries/notifications";

/** Retorna usuário logado, contagem de notificações e estado do tour. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [unreadCount, settings, pendingUsersCount] = await Promise.all([
    countUnreadNotifications(session.userId),
    getUserSettings(session.userId),
    session.role === "STAFF" ? countPendingUsers() : Promise.resolve(0),
  ]);

  return NextResponse.json({
    user: {
      id: session.userId,
      corporateId: session.corporateId,
      name: session.name,
      role: session.role,
      status: session.status,
    },
    unreadNotifications: unreadCount,
    pendingUsersCount,
    theme: settings.theme,
    tour: {
      currentVersion: APP_TOUR_VERSION,
      completedVersion: settings.tourCompletedVersion,
      shouldRun: settings.tourCompletedVersion < APP_TOUR_VERSION,
    },
  });
}
