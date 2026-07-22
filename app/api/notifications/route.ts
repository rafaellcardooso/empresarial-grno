import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/queries/notifications";

/** Lista notificações do usuário logado. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await listUserNotifications(session.userId);

  return NextResponse.json({
    notifications: items.map((item) => ({
      id: item.notification_id,
      title: item.title,
      body: item.body,
      deliveredAt: item.delivered_at.toISOString(),
      readAt: item.read_at ? item.read_at.toISOString() : null,
      sentAt: item.sent_at ? item.sent_at.toISOString() : null,
    })),
  });
}

/** Marca todas como lidas (?all=1) ou uma específica via body. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("all") === "1") {
    await markAllNotificationsRead(session.userId);
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => null)) as { id?: number } | null;
  const notificationId = Number(body?.id);
  if (!notificationId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await markNotificationRead(session.userId, notificationId);
  return NextResponse.json({ ok: true });
}
