import { NextResponse } from "next/server";
import { countRalsByCf } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Retorna contagem de RALs ativas por CF executante. */
export async function GET() {
  try {
    const data = await countRalsByCf();
    return NextResponse.json({ status: "sucesso", data });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao consultar o banco de dados para contagem.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
