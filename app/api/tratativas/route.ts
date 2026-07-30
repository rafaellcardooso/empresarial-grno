import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  TratativaClosedError,
  TratativaConflictError,
  listActiveTratativas,
  startTratativa,
} from "@/lib/queries/tratativas";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";

type StartBody = {
  recordKind?: string;
  recordKey?: string;
  note?: string | null;
};

/** Lista tratativas ativas por kind e chaves (?kind=RAL&keys=a,b,c). */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const recordKind = parseTratativaRecordKind(url.searchParams.get("kind"));
  const keysParam = url.searchParams.get("keys") ?? "";

  if (!recordKind) {
    return NextResponse.json({ error: "Tipo de registro inválido" }, { status: 400 });
  }

  const keys = keysParam
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  const tratativas = await listActiveTratativas(recordKind, keys);
  const byKey = Object.fromEntries(tratativas.map((item) => [item.recordKey, item]));

  return NextResponse.json({ tratativas: byKey });
}

/** Assumir tratativa de um registro RAL, REC ou BSOD. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as StartBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const tratativa = await startTratativa({
      recordKind,
      recordKey,
      userId: session.userId,
      note: body?.note ?? null,
    });

    return NextResponse.json({ tratativa });
  } catch (error) {
    if (error instanceof TratativaConflictError) {
      return NextResponse.json(
        { error: error.message, tratativa: error.existing },
        { status: 409 },
      );
    }
    if (error instanceof TratativaClosedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Erro ao assumir tratativa.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
