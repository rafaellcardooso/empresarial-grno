import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import {
  isValidPassword,
  parseJsonBody,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/validation";
import { getUserById, updateUserPassword } from "@/lib/queries/app-users";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/** Altera senha do usuário autenticado. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await parseJsonBody<ChangePasswordBody>(request);
  const currentPassword = body?.currentPassword ?? "";
  const newPassword = body?.newPassword ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
  }

  if (!isValidPassword(newPassword)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const user = await getUserById(session.userId);
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  }

  await updateUserPassword(session.userId, await hashPassword(newPassword));

  return NextResponse.json({ ok: true, message: "Senha alterada com sucesso." });
}
