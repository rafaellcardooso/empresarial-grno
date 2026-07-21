import { NextResponse } from "next/server";
import { listActiveRecs } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Lista RECs ativas em JSON. */
export async function GET() {
  try {
    const data = await listActiveRecs();
    return NextResponse.json({
      status: "sucesso",
      total_registros: data.length,
      data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao acessar o banco de dados de RECs.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
