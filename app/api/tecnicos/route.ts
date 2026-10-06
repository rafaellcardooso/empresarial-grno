import { NextResponse, type NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/auth/validation";
import { tecnicoLimitFromParam, tecnicoPageFromParam } from "@/lib/config/tecnicos";
import { createTecnico, isTecnicoLoginTaken, listTecnicos } from "@/lib/queries/tecnicos";
import { tecnicoFiltersFromParams } from "@/lib/tecnicos/filters";
import { authorizeTecnicosRoute } from "@/lib/tecnicos/route-auth";
import { validateTecnicoInput } from "@/lib/tecnicos/validate";

export const dynamic = "force-dynamic";

/** Lista técnicos paginados (RG/CPF mascarados) por DDD, skill e busca. */
export async function GET(request: NextRequest) {
  const auth = await authorizeTecnicosRoute();
  if (auth.response) return auth.response;

  const params = request.nextUrl.searchParams;
  const filters = tecnicoFiltersFromParams(
    {
      ddd: params.get("ddd"),
      skill: params.get("skill"),
      q: params.get("q"),
      inativos: params.get("inativos"),
    },
    auth.session.role === "STAFF",
  );
  const page = tecnicoPageFromParam(params.get("page"));
  const limit = tecnicoLimitFromParam(params.get("limit"));

  try {
    const { items, total } = await listTecnicos(filters, page, limit);
    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error("[tecnicos]", error);
    return NextResponse.json({ error: "Falha ao listar técnicos." }, { status: 500 });
  }
}

/** Cadastra técnico (STAFF). */
export async function POST(request: Request) {
  const auth = await authorizeTecnicosRoute({ staff: true });
  if (auth.response) return auth.response;

  const parsed = validateTecnicoInput(await parseJsonBody<Record<string, unknown>>(request));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    if (await isTecnicoLoginTaken(parsed.value.login)) {
      return NextResponse.json({ error: "Login já cadastrado." }, { status: 409 });
    }
    const id = await createTecnico(parsed.value, auth.session.userId);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("[tecnicos]", error);
    return NextResponse.json({ error: "Falha ao cadastrar técnico." }, { status: 500 });
  }
}
