import { NextRequest, NextResponse } from "next/server";
import { parseBsodSearchParams } from "@/lib/config/bsod-filters";
import type { BsodListScope } from "@/lib/queries/bsod";
import { listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";

/** Lista inventário ou alarmes PME/BSOD com filtros via query string. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const scope: BsodListScope = sp.get("scope") === "alarms" ? "alarms" : "inventory";
  try {
    const data = await listPmeBsod({
      ...parseBsodSearchParams(
        {
          filtro: sp.get("filtro") ?? undefined,
          saude: sp.get("saude") ?? undefined,
          cmts: sp.get("cmts") ?? undefined,
          node: sp.get("node") ?? undefined,
          q: sp.get("q") ?? undefined,
          ddd: sp.get("ddd") ?? undefined,
          status: sp.get("status") ?? undefined,
        },
        { scope },
      ),
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
