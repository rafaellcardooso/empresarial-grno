import { NextRequest, NextResponse } from "next/server";
import { parseTxDifParam, parseTxSearchParam, parseTxUfParam } from "@/lib/config/tx-filters";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { TX_EXPORT_COLUMNS, txRowsForExport } from "@/lib/export/tx-columns";
import { listTxOpticalSpansForExport } from "@/lib/queries/tx";

export const dynamic = "force-dynamic";

/** Exporta todos os enlaces ópticos TX do escopo filtrado, sem paginação visual. */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = await listTxOpticalSpansForExport({
      uf: parseTxUfParam(sp.get("uf")),
      q: parseTxSearchParam(sp.get("q")),
      dif: parseTxDifParam(sp.get("dif")),
    });
    const csv = rowsToCsv(txRowsForExport(rows), TX_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(buildCsvFilename("tx-optical"), rows.length),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao exportar enlaces TX.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
