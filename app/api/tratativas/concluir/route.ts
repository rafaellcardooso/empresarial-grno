import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";
import {
  concludeSirTratativa,
  TratativaConclusionError,
  TratativaForbiddenError,
  TratativaNotFoundError,
  TratativaRequiredError,
} from "@/lib/queries/tratativas";
import { TratativaWorkflowError, concludeTratativa } from "@/lib/queries/tratativa-workflow";

type ConcluirBody = {
  recordKind?: string;
  recordKey?: string;
  note?: string | null;
};

/** Conclui tratativa BSOD validada ou SIR já encerrada na fonte. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ConcluirBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    if (recordKind === "RAL" || recordKind === "REC") {
      await concludeSirTratativa({
        recordKind,
        recordKey,
        userId: session.userId,
        userRole: session.role,
        note: body?.note ?? "",
      });
    } else {
      await concludeTratativa({
        recordKind,
        recordKey,
        userId: session.userId,
        userRole: session.role,
        note: body?.note ?? null,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

/** Mapeia erros do fluxo de tratativa para resposta HTTP. */
function workflowErrorResponse(error: unknown) {
  if (
    error instanceof TratativaRequiredError ||
    error instanceof TratativaNotFoundError ||
    error instanceof TratativaConclusionError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof TratativaForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof TratativaWorkflowError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "Erro ao concluir tratativa.";
  return NextResponse.json({ error: message }, { status: 500 });
}
