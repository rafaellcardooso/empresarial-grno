import { NextRequest, NextResponse } from "next/server";
import { parseBsodFilterParam } from "@/lib/config/bsod-filters";
import { listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";

/** Lista inventário PME/BSOD com filtros via query string. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await listPmeBsod({
      ...parseBsodFilterParam(sp.get("filtro") ?? undefined),
      cmts: sp.get("cmts") || undefined,
      node: sp.get("node") || undefined,
      ope: sp.get("ope") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : 500,
    });
    return NextResponse.json({
      status: "sucesso",
      total_registros: data.length,
      data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao consultar inventário PME/BSOD no hfc-sls.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
