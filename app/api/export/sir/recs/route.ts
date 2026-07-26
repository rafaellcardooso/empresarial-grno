import { NextRequest, NextResponse } from "next/server";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { isRecTipoKey } from "@/lib/config/rec-types";
import { sirStatusFromParam } from "@/lib/config/sir-status";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import { REC_EXPORT_COLUMNS } from "@/lib/export/sir-columns";
import { listAllRecsForExport } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Exporta RECs filtradas em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const tipoParam = sp.get("tipo") ?? undefined;
    const rows = await listAllRecsForExport({
      status: sirStatusFromParam(sp.get("status") ?? undefined),
      tipo: isRecTipoKey(tipoParam) ? tipoParam : undefined,
      cf: cfFilterFromParam(sp.get("cf") ?? undefined),
    });

    const csv = rowsToCsv(rows as Record<string, unknown>[], REC_EXPORT_COLUMNS);
    const filename = buildCsvFilename("recs");
    return new NextResponse(csv, {
      headers: csvDownloadHeaders(filename, rows.length),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Falha ao exportar RECs.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
