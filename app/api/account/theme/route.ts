import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAppTheme, setThemeCookie } from "@/lib/auth/theme";
import { parseJsonBody } from "@/lib/auth/validation";
import { getUserThemePreference, setUserThemePreference } from "@/lib/queries/app-users";

type ThemeBody = { theme?: string };

/** Retorna tema preferido do usuário logado. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const theme = await getUserThemePreference(session.userId);
  return NextResponse.json({ theme });
}

/** Salva tema preferido do usuário logado. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await parseJsonBody<ThemeBody>(request);
  const theme = body?.theme;

  if (!isAppTheme(theme)) {
    return NextResponse.json({ error: "Tema inválido." }, { status: 400 });
  }

  await setUserThemePreference(session.userId, theme);

  const response = NextResponse.json({ ok: true, theme });
  setThemeCookie(response, theme);
  return response;
}
