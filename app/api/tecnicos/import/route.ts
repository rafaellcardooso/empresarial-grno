import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/auth/validation";
import { importTecnicos } from "@/lib/queries/tecnicos";
import { parseTecnicosCsv } from "@/lib/tecnicos/csv";
import { authorizeTecnicosRoute } from "@/lib/tecnicos/route-auth";

export const dynamic = "force-dynamic";

const MAX_CSV_BYTES = 1_000_000;

/** Importa técnicos de CSV (STAFF): valida todas as linhas e grava tudo ou nada (upsert por login). */
export async function POST(request: Request) {
  const auth = await authorizeTecnicosRoute({ staff: true });
  if (auth.response) return auth.response;

  const body = await parseJsonBody<{ content?: unknown }>(request);
  const content = typeof body?.content === "string" ? body.content : "";
  if (!content.trim()) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }
  if (content.length > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "Arquivo acima de 1 MB." }, { status: 413 });
  }

  const { rows, columns, errors } = parseTecnicosCsv(content);
  if (errors.length) {
    return NextResponse.json({ error: "Arquivo com erros.", errors }, { status: 422 });
  }

  try {
    const result = await importTecnicos(rows, columns, auth.session.userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[tecnicos-import]", error);
    return NextResponse.json({ error: "Falha ao importar técnicos." }, { status: 500 });
  }
}
