import { NextRequest, NextResponse } from "next/server";
import {
  parseSdhDddParam,
  parseSdhStatusParam,
  parseSdhVendorParam,
} from "@/lib/config/sdh-filters";
import { listSdhReportAtivos, sdhReportAtivosPageSize } from "@/lib/queries/sdh-report-ativos";
import type { SdhReportAtivosDim } from "@/lib/models/sdh-report-ativos";

export const dynamic = "force-dynamic";

/** Normaliza dimensão do drill-down SDH. */
function dimFromParam(param: string | null): SdhReportAtivosDim | null {
  if (param === "ddd" || param === "vendor" || param === "municipio" || param === "alarme") {
    return param;
  }
  return null;
}

/** Lista ativos SDH filtrados pela fatia de ranking do relatório. */
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
    const pageSize = sdhReportAtivosPageSize(Number(sp.get("limit") ?? undefined));
    const result = await listSdhReportAtivos({
      dim,
      key,
      vendor: parseSdhVendorParam(sp.get("vendor") ?? undefined),
      ddd: parseSdhDddParam(sp.get("ddd") ?? undefined),
      status: parseSdhStatusParam(sp.get("status") ?? undefined),
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
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao listar ativos do relatório SDH.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
