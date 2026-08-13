import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/auth/validation";
import {
  createNotification,
  getStaffNotificationsPage,
  sendNotificationToAllUsers,
} from "@/lib/queries/notifications";

type CreateBody = { title?: string; body?: string; send?: boolean };

/** Lista notificações criadas (staff), paginadas. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  const result = await getStaffNotificationsPage(page);

  return NextResponse.json({
    notifications: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.created_at.toISOString(),
      sentAt: item.sent_at ? item.sent_at.toISOString() : null,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    draftCount: result.draftCount,
  });
}

/** Cria notificação; com send=true dispara para todos os usuários ativos. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await parseJsonBody<CreateBody>(request);
  const title = body?.title?.trim() ?? "";
  const content = body?.body?.trim() ?? "";

  if (!title || title.length < 3) {
    return NextResponse.json({ error: "Informe um título." }, { status: 400 });
  }

  if (!content || content.length < 3) {
    return NextResponse.json({ error: "Informe o conteúdo da notificação." }, { status: 400 });
  }

  const notificationId = await createNotification({
    title,
    body: content,
    createdBy: session.userId,
  });

  let recipientCount = 0;
  if (body?.send) {
    recipientCount = await sendNotificationToAllUsers(notificationId);
  }

  return NextResponse.json({
    ok: true,
    notificationId,
    recipientCount,
    message: body?.send
      ? `Notificação enviada para ${recipientCount} usuário(s).`
      : "Rascunho salvo. Use enviar para disparar.",
  });
}
