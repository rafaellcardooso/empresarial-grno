import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";

/** Exige usuário autenticado e ativo; redireciona para login. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    redirect("/login");
  }
  return session;
}

/** Exige papel STAFF; redireciona usuários comuns. */
export async function requireStaff(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "STAFF") {
    redirect("/");
  }
  return session;
}
