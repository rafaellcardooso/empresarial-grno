import { NextResponse } from "next/server";
import { getRecByNum } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ num_recup: string }> };

/** Retorna REC por num_recup ou 404. */
export async function GET(_req: Request, ctx: Ctx) {
  const { num_recup } = await ctx.params;
  try {
    const rec = await getRecByNum(num_recup);
    if (!rec) {
      return NextResponse.json(
        {
          status: "erro",
          mensagem: `REC com número '${num_recup}' não encontrado.`,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ status: "sucesso", data: rec });
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
