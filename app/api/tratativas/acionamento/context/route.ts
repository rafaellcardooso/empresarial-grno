import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAcionamentoContext } from "@/lib/queries/acionamento-context";
import { suggestAcionamentoJanela } from "@/lib/tratativa/build-acionamento-message";
import { normalizeTratativaKey, parseTratativaRecordKind } from "@/lib/tratativa/keys";

/** Retorna contexto para montar acionamento WhatsApp (BSOD, RAL ou REC). */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const recordKind = parseTratativaRecordKind(url.searchParams.get("kind"));
  const recordKey = url.searchParams.get("key")?.trim();

  if (!recordKind || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const normalizedKey = normalizeTratativaKey(recordKind, recordKey);
  const context = await getAcionamentoContext(recordKind, normalizedKey);
  if (!context) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    context,
    suggestedJanela: suggestAcionamentoJanela(),
  });
}
