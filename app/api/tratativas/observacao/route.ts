import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  TratativaForbiddenError,
  TratativaRequiredError,
  updateTratativaObservation,
} from "@/lib/queries/tratativas";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";

type ObservationBody = {
  recordKind?: string;
  recordKey?: string;
  note?: string;
};

/** Atualiza a observação operacional de uma tratativa ativa. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ObservationBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();
  const note = body?.note?.trim();
  if (!recordKind || !recordKey || !note) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const tratativa = await updateTratativaObservation({
      recordKind,
      recordKey,
      note,
      userId: session.userId,
      userRole: session.role,
    });
    return NextResponse.json({ tratativa });
  } catch (error) {
    if (error instanceof TratativaRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TratativaForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const detail = error instanceof Error ? error.message : "Erro ao atualizar observação.";
    if (detail.includes("event_type")) {
      return NextResponse.json(
        { error: "Schema desatualizado. Rode npm run db:migrate no servidor." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
