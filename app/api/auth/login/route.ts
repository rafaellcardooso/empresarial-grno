import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { setThemeCookie } from "@/lib/auth/theme";
import { isValidCorporateId, normalizeCorporateId, parseJsonBody } from "@/lib/auth/validation";
import { getUserByCorporateId, getUserThemePreference } from "@/lib/queries/app-users";

type LoginBody = {
  corporateId?: string;
  password?: string;
  rememberMe?: boolean;
};

/** Autentica usuário ativo e define cookie de sessão. */
export async function POST(request: Request) {
  const body = await parseJsonBody<LoginBody>(request);
  const corporateId = body?.corporateId?.trim() ?? "";
  const password = body?.password ?? "";
  const rememberMe = Boolean(body?.rememberMe);

  if (!isValidCorporateId(corporateId) || !password) {
    return NextResponse.json({ error: "Matrícula ou senha inválidos." }, { status: 400 });
  }

  const user = await getUserByCorporateId(corporateId);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  if (user.status === "PENDING") {
    return NextResponse.json(
      { error: "Conta aguardando aprovação do administrador." },
      { status: 403 },
    );
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Conta inativa ou suspensa." }, { status: 403 });
  }

  const theme = await getUserThemePreference(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      corporateId: normalizeCorporateId(user.corporate_id),
      name: user.name,
      role: user.role,
      status: user.status,
    },
    theme,
  });

  await setSessionCookie(
    response,
    {
      userId: user.id,
      corporateId: normalizeCorporateId(user.corporate_id),
      name: user.name,
      role: user.role,
      status: user.status,
    },
    rememberMe,
  );
  setThemeCookie(response, theme);

  return response;
}
