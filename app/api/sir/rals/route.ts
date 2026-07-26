import { NextRequest, NextResponse } from "next/server";
import { sirLimitFromParam, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { countActiveRals, listActiveRals, pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Lista RALs ativas em JSON (paginação opcional via `page` e `limit`). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const hasPagination = sp.has("page") || sp.has("limit");
    const page = sirPageFromParam(sp.get("page"));
    const limit = hasPagination ? sirLimitFromParam(sp.get("limit")) : undefined;
    const offset = limit != null ? sirListOffset(page, limit) : undefined;

    const [data, total] = await Promise.all([
      listActiveRals({ limit, offset }),
      hasPagination ? countActiveRals() : Promise.resolve(null),
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
        mensagem: "Falha ao acessar o banco de dados.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

/** Verifica conectividade MySQL SIR (HEAD para monitoramento). */
export async function HEAD() {
  const ping = await pingSirDb();
  return new NextResponse(null, { status: ping.ok ? 200 : 503 });
}
