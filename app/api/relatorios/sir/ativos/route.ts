import { NextRequest, NextResponse } from "next/server";
import { sirTreatmentFromParam } from "@/lib/config/sir-filters";
import { operationalDddFromParam } from "@/lib/config/locations";
import { listSirReportAtivos, sirReportAtivosPageSize } from "@/lib/queries/sir-report-ativos";
import type { SirReportAtivosDim, SirReportAtivosDomain } from "@/lib/models/sir-report-ativos";

export const dynamic = "force-dynamic";

/** Normaliza dimensão do drill-down. */
function dimFromParam(param: string | null): SirReportAtivosDim | null {
  if (param === "ddd" || param === "tipo" || param === "cf") return param;
  return null;
}

/** Normaliza domínio do drill-down. */
function domainFromParam(param: string | null): SirReportAtivosDomain {
  if (param === "RAL" || param === "REC") return param;
  return "all";
}

/** Lista ativos SIR filtrados pela fatia de ranking do relatório. */
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
    const pageSize = sirReportAtivosPageSize(Number(sp.get("limit") ?? undefined));
    const result = await listSirReportAtivos({
      dim,
      key,
      domain: domainFromParam(sp.get("domain")),
      tratativa: sirTreatmentFromParam(sp.get("tratativa") ?? undefined),
      reportDdd: operationalDddFromParam(sp.get("reportDdd") ?? undefined),
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
        mensagem: "Falha ao listar ativos do relatório SIR.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
