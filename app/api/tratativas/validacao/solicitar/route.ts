import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";
import { TratativaForbiddenError, TratativaRequiredError } from "@/lib/queries/tratativas";
import { TratativaWorkflowError, requestValidacao } from "@/lib/queries/tratativa-workflow";

type WorkflowBody = {
  recordKind?: string;
  recordKey?: string;
};

/** Registra pedido de validação do técnico ao acionador (BSOD). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as WorkflowBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    await requestValidacao({
      recordKind,
      recordKey,
      userId: session.userId,
      userRole: session.role,
    });
    return NextResponse.json({ ok: true, workflowStatus: "validacao_pendente" });
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

/** Mapeia erros do fluxo de tratativa para resposta HTTP. */
function workflowErrorResponse(error: unknown) {
  if (error instanceof TratativaRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof TratativaForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof TratativaWorkflowError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "Erro no fluxo de tratativa.";
  return NextResponse.json({ error: message }, { status: 500 });
}
