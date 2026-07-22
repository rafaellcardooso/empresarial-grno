import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import {
  isValidPassword,
  parseJsonBody,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/validation";
import { getUserById, updateUserPassword } from "@/lib/queries/app-users";

type ResetPasswordBody = {
  password?: string;
  confirmPassword?: string;
};

/** Redefine senha de usuário (staff). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
      { error: "Use a página Minha conta para alterar sua própria senha." },
      { status: 400 },
    );
  }

  const body = await parseJsonBody<ResetPasswordBody>(request);
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await updateUserPassword(userId, await hashPassword(password));

  return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso." });
}
