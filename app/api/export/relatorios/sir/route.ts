import { NextRequest, NextResponse } from "next/server";
import { parseSirReportParams } from "@/lib/config/sir-report-filters";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import {
  SIR_REPORT_EXPORT_COLUMNS,
  sirReportExportBasename,
  sirReportRowsForExport,
} from "@/lib/export/sir-report-columns";
import { getSirReport } from "@/lib/queries/sir-reports";

export const dynamic = "force-dynamic";

/** Exporta o resumo gerencial SIR (mesmas definições do painel). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const filters = parseSirReportParams({
      de: sp.get("de") ?? undefined,
      ate: sp.get("ate") ?? undefined,
      dominio: sp.get("dominio") ?? undefined,
      tratativa: sp.get("tratativa") ?? undefined,
      ddd: sp.get("ddd") ?? undefined,
    });
    const data = await getSirReport(filters);
    const rows = sirReportRowsForExport(data);
    const csv = rowsToCsv(rows, SIR_REPORT_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(buildCsvFilename(sirReportExportBasename(filters)), rows.length),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao exportar relatório SIR.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
