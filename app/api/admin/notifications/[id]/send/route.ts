import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getNotificationById, sendNotificationToAllUsers } from "@/lib/queries/notifications";

/** Dispara notificação existente para todos os usuários ativos. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await context.params;
  const notificationId = Number(id);
  if (!notificationId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const notification = await getNotificationById(notificationId);
  if (!notification) {
    return NextResponse.json({ error: "Notificação não encontrada." }, { status: 404 });
  }

  if (notification.sent_at) {
    return NextResponse.json({ error: "Notificação já enviada." }, { status: 400 });
  }

  const recipientCount = await sendNotificationToAllUsers(notificationId);

  return NextResponse.json({
    ok: true,
    recipientCount,
    message: `Notificação enviada para ${recipientCount} usuário(s).`,
  });
}
