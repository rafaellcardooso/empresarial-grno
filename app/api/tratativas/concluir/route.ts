import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import { parseAcionamentoRecordKind } from "@/lib/tratativa/keys";
import {
  concludeSirTratativa,
  TratativaConclusionError,
  TratativaForbiddenError,
  TratativaNotFoundError,
  TratativaRequiredError,
} from "@/lib/queries/tratativas";
import { TratativaWorkflowError, concludeTratativa } from "@/lib/queries/tratativa-workflow";
import {
  concludeSdhTratativa,
  SdhTratativaConclusionError,
  SdhTratativaForbiddenError,
} from "@/lib/queries/sdh";
import {
  formatValidacaoFcaMessage,
  getValidacaoFcaValidationError,
} from "@/lib/tratativa/validate-validacao-fca";

type ConcluirBody = {
  recordKind?: string;
  recordKey?: string;
  note?: string | null;
  fca?: Partial<ValidacaoFcaInput> | null;
};

/** Conclui tratativa BSOD/SIR/SDH normalizada na fonte com FCA, ou BSOD validada no fluxo legado. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ConcluirBody | null;
  const recordKind = parseAcionamentoRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const hasFcaPayload = Boolean(body?.fca);
    if (
      recordKind === "RAL" ||
      recordKind === "REC" ||
      recordKind === "SDH" ||
      (recordKind === "BSOD" && hasFcaPayload)
    ) {
      const fca: ValidacaoFcaInput = {
        fato: String(body?.fca?.fato ?? "").trim(),
        causa: String(body?.fca?.causa ?? "").trim(),
        acao: String(body?.fca?.acao ?? "").trim(),
      };
      const fcaError = getValidacaoFcaValidationError(fca);
      if (fcaError) {
        return NextResponse.json({ error: fcaError }, { status: 400 });
      }
      const messageText = formatValidacaoFcaMessage(fca);

      if (recordKind === "SDH") {
        const alarmId = Number(recordKey);
        if (!Number.isInteger(alarmId) || alarmId <= 0) {
          return NextResponse.json({ error: "Alarme SDH inválido." }, { status: 400 });
        }
        await concludeSdhTratativa({
          alarmId,
          userId: session.userId,
          userRole: session.role,
          messageText,
          note: body?.note ?? null,
        });
      } else {
        await concludeSirTratativa({
          recordKind,
          recordKey,
          userId: session.userId,
          userRole: session.role,
          note: body?.note ?? null,
          messageText,
        });
      }
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
    error instanceof TratativaConclusionError ||
    error instanceof SdhTratativaConclusionError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof TratativaForbiddenError || error instanceof SdhTratativaForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof TratativaWorkflowError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "Erro ao concluir tratativa.";
  return NextResponse.json({ error: message }, { status: 500 });
}
