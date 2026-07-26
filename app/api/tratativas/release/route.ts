import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  TratativaForbiddenError,
  TratativaNotFoundError,
  releaseTratativa,
} from "@/lib/queries/tratativas";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";

type ReleaseBody = {
  recordKind?: string;
  recordKey?: string;
};

/** Libera tratativa ativa (própria ou qualquer, se STAFF). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ReleaseBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    await releaseTratativa({
      recordKind,
      recordKey,
      userId: session.userId,
      userRole: session.role,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TratativaNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TratativaForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Erro ao liberar tratativa.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
