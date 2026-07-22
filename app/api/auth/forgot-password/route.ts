import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  CORPORATE_ID_HINT,
  isValidCorporateId,
  isValidPassword,
  normalizeCorporateId,
  parseJsonBody,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/validation";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { getUserByCorporateId, updateUserPassword } from "@/lib/queries/app-users";
import { notifyActiveStaff } from "@/lib/queries/notifications";

type ForgotBody = {
  corporateId?: string;
  password?: string;
  confirmPassword?: string;
};

/** Redefine senha com matrícula (sem e-mail). */
export async function POST(request: Request) {
  const body = await parseJsonBody<ForgotBody>(request);
  const corporateId = body?.corporateId?.trim() ?? "";
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (!isValidCorporateId(corporateId)) {
    return NextResponse.json({ error: CORPORATE_ID_HINT }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const user = await getUserByCorporateId(corporateId);
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: AUTH_COPY.forgotVerifyError }, { status: 400 });
  }

  await updateUserPassword(user.id, await hashPassword(password));

  const normalizedId = normalizeCorporateId(corporateId);
  await notifyActiveStaff(
    AUTH_COPY.passwordSelfResetNotificationTitle,
    `${user.name} (${normalizedId}) redefiniu a própria senha.`,
  );

  return NextResponse.json({ ok: true, message: AUTH_COPY.forgotSuccess });
}
