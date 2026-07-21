import { NextResponse } from "next/server";
import { getRalByNum } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ num_recup: string }> };

/** Retorna RAL por num_recup ou 404. */
export async function GET(_req: Request, ctx: Ctx) {
  const { num_recup } = await ctx.params;
  try {
    const ral = await getRalByNum(num_recup);
    if (!ral) {
      return NextResponse.json(
        {
          status: "erro",
          mensagem: `RAL com número '${num_recup}' não encontrado.`,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ status: "sucesso", data: ral });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao acessar o banco de dados.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
