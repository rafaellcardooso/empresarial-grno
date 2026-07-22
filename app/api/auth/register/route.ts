import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  CORPORATE_ID_HINT,
  isValidCorporateId,
  isValidEmail,
  isValidPassword,
  normalizeCorporateId,
  parseJsonBody,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/validation";
import { createPendingUser, getUserByCorporateId } from "@/lib/queries/app-users";
import { notifyActiveStaff } from "@/lib/queries/notifications";

type RegisterBody = {
  corporateId?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
};

/** Cria conta pendente de aprovação staff. */
export async function POST(request: Request) {
  const body = await parseJsonBody<RegisterBody>(request);
  const corporateId = body?.corporateId?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";
  const email = body?.email?.trim() ?? "";

  if (!isValidCorporateId(corporateId)) {
    return NextResponse.json({ error: CORPORATE_ID_HINT }, { status: 400 });
  }

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "E-mail de contato inválido." }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const existing = await getUserByCorporateId(corporateId);
  if (existing) {
    return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const normalizedId = normalizeCorporateId(corporateId);

  await createPendingUser({
    corporateId: normalizedId,
    name,
    passwordHash,
    email: email || null,
  });

  await notifyActiveStaff(
    "Nova solicitação de acesso",
    `${name} (${normalizedId}) solicitou acesso. Aprove em Administração → Aprovações.`,
  );

  return NextResponse.json({
    ok: true,
    message: "Cadastro recebido. Aguarde aprovação do administrador.",
  });
}
