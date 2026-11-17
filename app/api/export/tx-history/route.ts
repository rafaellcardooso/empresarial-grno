import { NextRequest, NextResponse } from "next/server";
import { parseTxHistorySearchParams } from "@/lib/config/tx-history-filters";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { TX_HISTORY_EXPORT_COLUMNS, txHistoryRowsForExport } from "@/lib/export/tx-history-columns";
import { listTxOpticalSamplesForExport } from "@/lib/queries/tx-history";

export const dynamic = "force-dynamic";

/** Exporta amostras históricas TX do escopo filtrado, sem paginação visual. */
export async function GET(request: NextRequest) {
  try {
    const filters = parseTxHistorySearchParams(request.nextUrl.searchParams);
    const rows = await listTxOpticalSamplesForExport(filters);
    const csv = rowsToCsv(txHistoryRowsForExport(rows), TX_HISTORY_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(buildCsvFilename("tx-optical-history"), rows.length),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao exportar histórico TX.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
