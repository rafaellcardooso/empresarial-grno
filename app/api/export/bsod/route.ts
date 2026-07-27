import { NextRequest, NextResponse } from "next/server";
import { parseBsodSearchParams } from "@/lib/config/bsod-filters";
import { BSOD_EXPORT_COLUMNS, bsodRowsForExport } from "@/lib/export/bsod-columns";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { listAllPmeBsodForExport } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";

/** Exporta inventário BSOD filtrado em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = await listAllPmeBsodForExport(
      parseBsodSearchParams({
        filtro: sp.get("filtro") ?? undefined,
        saude: sp.get("saude") ?? undefined,
        cmts: sp.get("cmts") ?? undefined,
        node: sp.get("node") ?? undefined,
        q: sp.get("q") ?? undefined,
      }),
    );

    const csv = rowsToCsv(bsodRowsForExport(rows), BSOD_EXPORT_COLUMNS);
    const filename = buildCsvFilename("bsod");
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(filename, rows.length),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Falha ao exportar inventário BSOD.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
