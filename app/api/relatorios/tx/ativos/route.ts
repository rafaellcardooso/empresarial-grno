import { NextRequest, NextResponse } from "next/server";
import type { TxReportAtivosDim } from "@/lib/models/tx-report-ativos";
import { listTxReportAtivos, txReportAtivosPageSize } from "@/lib/queries/tx-report-ativos";

export const dynamic = "force-dynamic";

/** Normaliza dimensão do drill-down TX. */
function dimFromParam(param: string | null): TxReportAtivosDim | null {
  if (param === "uf" || param === "empresa" || param === "dif") return param;
  return null;
}

/** Lista enlaces TX filtrados pela fatia de ranking do relatório. */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const dim = dimFromParam(sp.get("dim"));
    const key = sp.get("key")?.trim() ?? "";
    if (!dim || !key) {
      return NextResponse.json(
        { status: "erro", mensagem: "Parâmetros dim e key são obrigatórios." },
        { status: 400 },
      );
    }

    const page = Number(sp.get("page") ?? "1");
    const pageSize = txReportAtivosPageSize(Number(sp.get("limit") ?? undefined));
    const result = await listTxReportAtivos({
      dim,
      key,
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      pageSize,
    });

    return NextResponse.json({
      status: "sucesso",
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      rows: result.rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao listar enlaces do relatório TX.",
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
