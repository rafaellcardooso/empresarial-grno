import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserRegionPrefs } from "@/lib/queries/app-users";
import { getShellAlerts } from "@/lib/queries/shell-alerts";

export const dynamic = "force-dynamic";

/** Retorna pendentes e alertas SIR filtrados pelos estados escolhidos pelo usuário. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const prefs = await getUserRegionPrefs(session.userId);
    return NextResponse.json(await getShellAlerts(prefs.alertUfs));
  } catch (error) {
    console.error("[shell-alerts]", error);
    return NextResponse.json({ error: "Falha ao carregar alertas." }, { status: 500 });
  }
}
