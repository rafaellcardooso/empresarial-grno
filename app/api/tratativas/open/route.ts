import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openTreatmentSession } from "@/lib/tratativa/open-treatment";
import { parseAcionamentoRecordKind } from "@/lib/tratativa/keys";

type OpenBody = {
  domain?: string;
  recordKey?: string;
};

/** Abre o painel de tratativa e assume automaticamente quando permitido. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as OpenBody | null;
  const domain = parseAcionamentoRecordKind(body?.domain);
  const recordKey = body?.recordKey?.trim();
  if (!domain || !recordKey) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const treatment = await openTreatmentSession({
      domain,
      recordKey,
      userId: session.userId,
      userRole: session.role,
      userName: session.name,
      userCorporateId: session.corporateId,
    });
    return NextResponse.json({ treatment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao abrir tratativa.";
    const status =
      message.includes("não encontrado") || message.includes("inválido")
        ? 404
        : message.includes("Somente")
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
