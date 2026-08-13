import { NextResponse } from "next/server";
import { parseProfileUpdateFields } from "@/lib/auth/profile-update";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/auth/validation";
import {
  countActiveStaffExcept,
  deleteUser,
  demoteStaffToUser,
  getUserById,
  isCorporateIdTaken,
  promoteUserToStaff,
  toPublicUser,
  updateUserProfile,
  updateUserStatus,
} from "@/lib/queries/app-users";
import type { AppUserStatus } from "@/lib/models/app-user";

type PatchBody = {
  action?: "approve" | "reject" | "suspend" | "reactivate" | "promote-staff" | "demote-user";
};

type PutBody = {
  corporateId?: string;
  name?: string;
  email?: string | null;
};

const STATUS_ACTIONS = new Set<NonNullable<PatchBody["action"]>>([
  "approve",
  "reject",
  "suspend",
  "reactivate",
]);

const ACTION_STATUS: Record<"approve" | "reject" | "suspend" | "reactivate", AppUserStatus> = {
  approve: "ACTIVE",
  reject: "REJECTED",
  suspend: "SUSPENDED",
  reactivate: "ACTIVE",
};

/** Aprova, rejeita, suspende ou altera papel staff/usuário. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!userId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await parseJsonBody<PatchBody>(request);
  const action = body?.action;
  if (!action) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (action === "promote-staff") {
    if (user.role === "STAFF") {
      return NextResponse.json({ error: "Usuário já é administrador." }, { status: 400 });
    }

    await promoteUserToStaff(userId, session.userId);
    const updated = await getUserById(userId);
    return NextResponse.json({
      ok: true,
      role: "STAFF" as const,
      user: updated ? toPublicUser(updated) : null,
    });
  }

  if (action === "demote-user") {
    if (user.role !== "STAFF") {
      return NextResponse.json({ error: "Usuário não é administrador." }, { status: 400 });
    }

    if (userId === session.userId) {
      return NextResponse.json(
        { error: "Você não pode remover seus próprios privilégios de administrador." },
        { status: 400 },
      );
    }

    if (user.status === "ACTIVE" && (await countActiveStaffExcept(userId)) === 0) {
      return NextResponse.json(
        { error: "Não é possível rebaixar o último administrador ativo." },
        { status: 400 },
      );
    }

    await demoteStaffToUser(userId);
    const updated = await getUserById(userId);
    return NextResponse.json({
      ok: true,
      role: "USER" as const,
      user: updated ? toPublicUser(updated) : null,
    });
  }

  if (!STATUS_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  if (user.role === "STAFF" && action === "suspend") {
    return NextResponse.json({ error: "Não é possível suspender staff." }, { status: 400 });
  }

  const status = ACTION_STATUS[action];
  await updateUserStatus(
    userId,
    status,
    action === "approve" || action === "reactivate" ? session.userId : null,
  );

  return NextResponse.json({ ok: true, status });
}

/** Atualiza matrícula, nome e e-mail (staff — qualquer usuário). */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!userId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const parsed = parseProfileUpdateFields(await parseJsonBody<PutBody>(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const { fields } = parsed;
  if (await isCorporateIdTaken(fields.corporateId, userId)) {
    return NextResponse.json({ error: "Login já cadastrado." }, { status: 409 });
  }

  await updateUserProfile(userId, fields);

  const updated = await getUserById(userId);
  const response = NextResponse.json({
    ok: true,
    user: updated ? toPublicUser(updated) : null,
  });

  if (updated && userId === session.userId) {
    await setSessionCookie(
      response,
      {
        userId: updated.id,
        corporateId: updated.corporate_id,
        name: updated.name,
        role: updated.role,
        status: updated.status,
      },
      true,
    );
  }

  return response;
}

/** Exclui usuário (staff). */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!userId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta." },
      { status: 400 },
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (user.role === "STAFF" && (await countActiveStaffExcept(userId)) === 0) {
    return NextResponse.json(
      { error: "Não é possível excluir o último administrador ativo." },
      { status: 400 },
    );
  }

  await deleteUser(userId);

  return NextResponse.json({ ok: true });
}
