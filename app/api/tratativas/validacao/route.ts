import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  type ValidacaoOutcome,
  workflowStatusFromValidacaoOutcome,
} from "@/lib/config/tratativa-workflow";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import { parseTratativaRecordKind } from "@/lib/tratativa/keys";
import { getValidacaoFcaValidationError } from "@/lib/tratativa/validate-validacao-fca";
import { TratativaForbiddenError, TratativaRequiredError } from "@/lib/queries/tratativas";
import { TratativaWorkflowError, recordValidacao } from "@/lib/queries/tratativa-workflow";

type ValidacaoBody = {
  recordKind?: string;
  recordKey?: string;
  outcome?: string;
  fca?: Partial<ValidacaoFcaInput>;
};

/** Registra resultado da validação pós-VT com FCA. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ValidacaoBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();
  const outcome = parseValidacaoOutcome(body?.outcome);
  const fca = normalizeFcaInput(body?.fca);

  if (!recordKind || !recordKey || !outcome) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const fcaError = getValidacaoFcaValidationError(fca);
  if (fcaError) {
    return NextResponse.json({ error: fcaError }, { status: 400 });
  }

  try {
    await recordValidacao({
      recordKind,
      recordKey,
      userId: session.userId,
      userRole: session.role,
      outcome,
      fca,
    });
    return NextResponse.json({
      ok: true,
      workflowStatus: workflowStatusFromValidacaoOutcome(outcome),
    });
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

/** Normaliza campos FCA do body da API. */
function normalizeFcaInput(raw: Partial<ValidacaoFcaInput> | undefined): ValidacaoFcaInput {
  return {
    fato: String(raw?.fato ?? "").trim(),
    causa: String(raw?.causa ?? "").trim(),
    acao: String(raw?.acao ?? "").trim(),
  };
}

function parseValidacaoOutcome(value?: string): ValidacaoOutcome | null {
  if (value === "aprovada" || value === "reprovada") return value;
  return null;
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
