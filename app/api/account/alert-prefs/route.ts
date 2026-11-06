import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/auth/validation";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { parseAlertUfsInput } from "@/lib/config/user-regions";
import { getUserRegionPrefs, setUserAlertUfs } from "@/lib/queries/app-users";

export const dynamic = "force-dynamic";

type PatchBody = {
  alertUfs?: unknown;
};

/** Retorna lotação e preferência de alertas do usuário autenticado. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prefs = await getUserRegionPrefs(session.userId);
  return NextResponse.json(prefs);
}

/** Atualiza somente os estados dos alertas. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await parseJsonBody<PatchBody>(request);
  const alertUfs = parseAlertUfsInput(body?.alertUfs);
  if (!alertUfs) {
    return NextResponse.json({ error: AUTH_COPY.alertUfsRequired }, { status: 400 });
  }

  await setUserAlertUfs(session.userId, alertUfs);
  const prefs = await getUserRegionPrefs(session.userId);
  return NextResponse.json({
    ok: true,
    message: AUTH_COPY.settingsAlertsSuccess,
    ...prefs,
  });
}
