import { NextResponse } from "next/server";
import { parseProfileUpdateFields } from "@/lib/auth/profile-update";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/auth/validation";
import {
  getUserById,
  isCorporateIdTaken,
  toPublicUser,
  updateUserProfile,
} from "@/lib/queries/app-users";

export const dynamic = "force-dynamic";

type PutBody = {
  corporateId?: string;
  name?: string;
  email?: string | null;
};

/** Atualiza matrícula, nome e e-mail do usuário autenticado. */
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const parsed = parseProfileUpdateFields(await parseJsonBody<PutBody>(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { fields } = parsed;
  if (await isCorporateIdTaken(fields.corporateId, session.userId)) {
    return NextResponse.json({ error: "Login já cadastrado." }, { status: 409 });
  }

  await updateUserProfile(session.userId, fields);
  const updated = await getUserById(session.userId);
  if (!updated) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    message: "Dados atualizados.",
    user: toPublicUser(updated),
  });

  await setSessionCookie(
    response,
    {
      userId: updated.id,
      corporateId: updated.corporate_id,
      name: updated.name,
      role: updated.role,
      status: updated.status,
    },
    true,
  );

  return response;
}
