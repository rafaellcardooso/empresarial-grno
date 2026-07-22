import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  CORPORATE_ID_HINT,
  isValidCorporateId,
  isValidEmail,
  parseJsonBody,
} from "@/lib/auth/validation";
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

/** Atualiza matrícula, nome e e-mail (staff). */
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

  const body = await parseJsonBody<PutBody>(request);
  if (!body) {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const corporateId = body.corporateId?.trim();
  const name = body.name?.trim();
  const email =
    body.email === undefined
      ? undefined
      : body.email === null || body.email.trim() === ""
        ? null
        : body.email.trim();

  if (corporateId !== undefined) {
    if (!isValidCorporateId(corporateId)) {
      return NextResponse.json({ error: CORPORATE_ID_HINT }, { status: 400 });
    }
    if (await isCorporateIdTaken(corporateId, userId)) {
      return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
    }
  }

  if (name !== undefined && name.length < 2) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  if (corporateId === undefined && name === undefined && email === undefined) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  await updateUserProfile(userId, {
    corporateId,
    name,
    email,
  });

  const updated = await getUserById(userId);
  return NextResponse.json({ ok: true, user: updated ? toPublicUser(updated) : null });
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
