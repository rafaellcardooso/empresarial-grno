import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { AcionamentoTechnicianInput } from "@/lib/models/acionamento";
import { getAcionamentoContext } from "@/lib/queries/acionamento-context";
import {
  TratativaForbiddenError,
  TratativaRequiredError,
  recordAcionamento,
} from "@/lib/queries/tratativas";
import { buildAcionamentoMessage } from "@/lib/tratativa/build-acionamento-message";
import { normalizeTratativaKey, parseTratativaRecordKind } from "@/lib/tratativa/keys";
import { getAcionamentoTechnicianValidationError } from "@/lib/tratativa/validate-acionamento-technician";

type AcionamentoBody = {
  recordKind?: string;
  recordKey?: string;
  technician?: Partial<AcionamentoTechnicianInput>;
};

/** Monta mensagem de acionamento, registra evento e retorna texto para WhatsApp. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AcionamentoBody | null;
  const recordKind = parseTratativaRecordKind(body?.recordKind);
  const recordKey = body?.recordKey?.trim();
  const technician = normalizeTechnicianInput(body?.technician);

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const validationError = getAcionamentoTechnicianValidationError(technician);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedKey = normalizeTratativaKey(recordKind, recordKey);
  const context = await getAcionamentoContext(recordKind, normalizedKey);
  if (!context) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  const message = buildAcionamentoMessage(context, technician);

  try {
    await recordAcionamento({
      recordKind,
      recordKey: normalizedKey,
      userId: session.userId,
      userRole: session.role,
      messageText: message,
    });
  } catch (error) {
    if (error instanceof TratativaRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TratativaForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const detail = error instanceof Error ? error.message : "Erro ao registrar acionamento.";
    if (detail.includes("message_text")) {
      return NextResponse.json(
        { error: "Schema desatualizado. Rode npm run db:migrate no servidor." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message });
}

/** Normaliza campos do técnico recebidos no body. */
function normalizeTechnicianInput(
  raw: Partial<AcionamentoTechnicianInput> | undefined,
): AcionamentoTechnicianInput {
  return {
    whatsappTarget: String(raw?.whatsappTarget ?? "").trim(),
    janela: String(raw?.janela ?? "").trim(),
    nome: String(raw?.nome ?? "").trim(),
    cidade: String(raw?.cidade ?? "").trim(),
    un: String(raw?.un ?? "").trim(),
    login: String(raw?.login ?? "").trim(),
    rg: String(raw?.rg ?? "").trim(),
    cpf: String(raw?.cpf ?? "").trim(),
    sintoma: String(raw?.sintoma ?? "").trim(),
  };
}
