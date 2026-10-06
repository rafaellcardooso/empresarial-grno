import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { FCA_SEARCH_MIN_LENGTH } from "@/lib/config/fca";
import { searchFcaRecords } from "@/lib/queries/fca";

export const dynamic = "force-dynamic";

const MAX_TERM_LENGTH = 120;

/** Busca chamados RAL/REC por número ou designação para preencher o FCA. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const term = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (term.length < FCA_SEARCH_MIN_LENGTH || term.length > MAX_TERM_LENGTH) {
    return NextResponse.json(
      { error: `Informe entre ${FCA_SEARCH_MIN_LENGTH} e ${MAX_TERM_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await searchFcaRecords(term));
  } catch (error) {
    console.error("[fca-search]", error);
    return NextResponse.json({ error: "Falha ao buscar chamados." }, { status: 500 });
  }
}
