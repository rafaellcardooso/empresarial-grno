import { NextRequest, NextResponse } from "next/server";
import {
  parseSdhDddParam,
  parseSdhSearchParam,
  parseSdhStatusParam,
  parseSdhVendorParam,
} from "@/lib/config/sdh-filters";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { SDH_EXPORT_COLUMNS, sdhRowsForExport } from "@/lib/export/sdh-columns";
import { listActiveSdhAlarms } from "@/lib/queries/sdh";

export const dynamic = "force-dynamic";

/** Exporta todos os alarmes SDH do escopo filtrado, sem paginação visual. */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = await listActiveSdhAlarms({
      vendor: parseSdhVendorParam(sp.get("vendor")),
      ddd: parseSdhDddParam(sp.get("ddd")),
      status: parseSdhStatusParam(sp.get("status")),
      q: parseSdhSearchParam(sp.get("q")),
    });
    const csv = rowsToCsv(sdhRowsForExport(rows), SDH_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(buildCsvFilename("sdh"), rows.length),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao exportar alarmes SDH.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
