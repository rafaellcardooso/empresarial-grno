import { NextRequest, NextResponse } from "next/server";
import { sirLimitFromParam, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { countActiveRecs, listActiveRecs } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Lista RECs ativas em JSON (paginação opcional via `page` e `limit`). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const hasPagination = sp.has("page") || sp.has("limit");
    const page = sirPageFromParam(sp.get("page"));
    const limit = hasPagination ? sirLimitFromParam(sp.get("limit")) : undefined;
    const offset = limit != null ? sirListOffset(page, limit) : undefined;

    const [data, total] = await Promise.all([
      listActiveRecs({ limit, offset }),
      hasPagination ? countActiveRecs() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      status: "sucesso",
      total_registros: total ?? data.length,
      ...(hasPagination ? { pagina: page, por_pagina: limit } : {}),
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
