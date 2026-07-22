import { NextResponse } from "next/server";
import { APP_TOUR_VERSION } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { markTourCompleted } from "@/lib/queries/app-users";

/** Marca tour interativo como concluído para a versão atual. */
export async function POST() {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await markTourCompleted(session.userId, APP_TOUR_VERSION);

  return NextResponse.json({ ok: true, version: APP_TOUR_VERSION });
}
