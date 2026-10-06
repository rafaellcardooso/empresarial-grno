import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export type RouteAuth =
  { session: SessionPayload; response?: never } | { session?: never; response: NextResponse };

/** Exige sessão ativa nas rotas de técnicos; `staff` exige também papel STAFF. */
export async function authorizeTecnicosRoute(options?: { staff?: boolean }): Promise<RouteAuth> {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return { response: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }
  if (options?.staff && session.role !== "STAFF") {
    return { response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
  }
  return { session };
}
