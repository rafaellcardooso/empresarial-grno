import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/auth/validation";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { parseAlertUfsInput, parseUserRegionUf } from "@/lib/config/user-regions";
import { getUserRegionPrefs, saveUserRegionSetup } from "@/lib/queries/app-users";

export const dynamic = "force-dynamic";

type PostBody = {
  homeUf?: unknown;
  alertUfs?: unknown;
};

/** Completa lotação e preferência de alertas (onboarding obrigatório). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await parseJsonBody<PostBody>(request);
  const homeUf = parseUserRegionUf(body?.homeUf);
  const alertUfs = parseAlertUfsInput(body?.alertUfs);

  if (!homeUf) {
    return NextResponse.json({ error: AUTH_COPY.homeUfRequired }, { status: 400 });
  }
  if (!alertUfs) {
    return NextResponse.json({ error: AUTH_COPY.alertUfsRequired }, { status: 400 });
  }

  await saveUserRegionSetup(session.userId, homeUf, alertUfs);
  const prefs = await getUserRegionPrefs(session.userId);
  return NextResponse.json({
    ok: true,
    message: AUTH_COPY.regionSetupSuccess,
    ...prefs,
  });
}
