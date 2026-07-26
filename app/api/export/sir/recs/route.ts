import { NextRequest, NextResponse } from "next/server";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { isRecTipoKey } from "@/lib/config/rec-types";
import { sirStatusFromParam } from "@/lib/config/sir-status";
import { SIR_EXPORT_MAX_ROWS } from "@/lib/config/sir-pagination";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { REC_EXPORT_COLUMNS } from "@/lib/export/sir-columns";
import { listRecs } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Exporta RECs filtradas em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const tipoParam = sp.get("tipo") ?? undefined;
    const rows = await listRecs({
      status: sirStatusFromParam(sp.get("status") ?? undefined),
      tipo: isRecTipoKey(tipoParam) ? tipoParam : undefined,
      cf: cfFilterFromParam(sp.get("cf") ?? undefined),
      limit: SIR_EXPORT_MAX_ROWS,
      offset: 0,
    });

    const csv = rowsToCsv(rows as Record<string, unknown>[], REC_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildCsvFilename("recs")}"`,
      },
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
