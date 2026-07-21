import { NextResponse } from "next/server";
import { countRecsByCf } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Retorna contagem de RECs ativas por CF executante. */
export async function GET() {
  try {
    const data = await countRecsByCf();
    return NextResponse.json({ status: "sucesso", data });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao consultar o banco de dados para contagem de RECs.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
