import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/auth/validation";
import { getTecnicoById, isTecnicoLoginTaken, updateTecnico } from "@/lib/queries/tecnicos";
import { authorizeTecnicosRoute } from "@/lib/tecnicos/route-auth";
import { validateTecnicoInput } from "@/lib/tecnicos/validate";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Lê id numérico positivo da rota. */
async function parseId(context: RouteContext): Promise<number | null> {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Retorna técnico com RG/CPF completos (preenchimento do acionamento; inativo só para STAFF). */
export async function GET(_request: Request, context: RouteContext) {
  const auth = await authorizeTecnicosRoute();
  if (auth.response) return auth.response;

  const id = await parseId(context);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const tecnico = await getTecnicoById(id);
  if (!tecnico || (!tecnico.ativo && auth.session.role !== "STAFF")) {
    return NextResponse.json({ error: "Técnico não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ tecnico });
}

/** Atualiza técnico, inclusive ativação/desativação (STAFF). */
export async function PUT(request: Request, context: RouteContext) {
  const auth = await authorizeTecnicosRoute({ staff: true });
  if (auth.response) return auth.response;

  const id = await parseId(context);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const parsed = validateTecnicoInput(await parseJsonBody<Record<string, unknown>>(request));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    if (!(await getTecnicoById(id))) {
      return NextResponse.json({ error: "Técnico não encontrado." }, { status: 404 });
    }
    if (await isTecnicoLoginTaken(parsed.value.login, id)) {
      return NextResponse.json(
        { error: "Login já cadastrado para outro técnico." },
        { status: 409 },
      );
    }
    await updateTecnico(id, parsed.value, auth.session.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[tecnicos]", error);
    return NextResponse.json({ error: "Falha ao salvar técnico." }, { status: 500 });
  }
}
