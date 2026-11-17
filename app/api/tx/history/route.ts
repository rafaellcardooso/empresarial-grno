import { NextRequest, NextResponse } from "next/server";
import { parseTxHistorySearchParams } from "@/lib/config/tx-history-filters";
import {
  listTxOpticalSamples,
  txHistoryLimitFromParam,
  txHistoryPageFromParam,
} from "@/lib/queries/tx-history";
import { serializeRows } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** Lista amostras históricas TX com paginação e filtros. */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const filters = parseTxHistorySearchParams(sp);
    const result = await listTxOpticalSamples({
      ...filters,
      page: txHistoryPageFromParam(sp.get("page")),
      limit: txHistoryLimitFromParam(sp.get("limit")),
    });

    return NextResponse.json({
      status: "sucesso",
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      rows: serializeRows(result.rows),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao listar histórico TX.",
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
