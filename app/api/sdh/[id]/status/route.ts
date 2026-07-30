import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listSdhTratativaEvents, updateSdhTratativaStatus } from "@/lib/queries/sdh";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StatusBody = {
  emTratativa?: boolean;
  observacao?: string | null;
};

/** Lista a cronologia da tratativa de um alarme SDH. */
export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: idRaw } = await context.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    return NextResponse.json({ events: await listSdhTratativaEvents(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar cronologia.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Marca, atualiza ou encerra tratativa de um alarme SDH. */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: idRaw } = await context.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as StatusBody | null;
  if (!body || typeof body.emTratativa !== "boolean") {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const alarm = await updateSdhTratativaStatus({
      id,
      emTratativa: body.emTratativa,
      userId: session.userId,
      observacao: body.observacao ?? null,
    });

    if (!alarm) {
      return NextResponse.json({ error: "Alarme não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ alarm });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar status.";
    const status = message.includes("obrigatória") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
