import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listAllUsers, listPendingUsers } from "@/lib/queries/app-users";

/** Lista usuários (staff). Query ?pending=1 retorna só pendentes. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const pendingOnly = new URL(request.url).searchParams.get("pending") === "1";
  const users = pendingOnly ? await listPendingUsers() : await listAllUsers();

  return NextResponse.json({ users });
}
