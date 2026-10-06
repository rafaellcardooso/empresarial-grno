import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getShellAlerts } from "@/lib/queries/shell-alerts";

export const dynamic = "force-dynamic";

/** Retorna pendentes por módulo (badges do menu) e chamados SIR /NET/FO ativos. */
export async function GET() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getShellAlerts());
  } catch (error) {
    console.error("[shell-alerts]", error);
    return NextResponse.json({ error: "Falha ao carregar alertas." }, { status: 500 });
  }
}
