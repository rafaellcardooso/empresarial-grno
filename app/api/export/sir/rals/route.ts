import { NextRequest, NextResponse } from "next/server";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { ralTipoValueFromParam } from "@/lib/config/ral-types";
import { sirStatusFromParam } from "@/lib/config/sir-status";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { RAL_EXPORT_COLUMNS } from "@/lib/export/sir-columns";
import { listAllRalsForExport } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Exporta RALs filtradas em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = await listAllRalsForExport({
      status: sirStatusFromParam(sp.get("status") ?? undefined),
      tipo: ralTipoValueFromParam(sp.get("tipo") ?? undefined),
      cf: cfFilterFromParam(sp.get("cf") ?? undefined),
    });

    const csv = rowsToCsv(rows as Record<string, unknown>[], RAL_EXPORT_COLUMNS);
    const filename = buildCsvFilename("rals");
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(filename, rows.length),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Falha ao exportar RALs.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
