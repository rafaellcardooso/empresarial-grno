import { NextRequest, NextResponse } from "next/server";
import { parseBsodSearchParams } from "@/lib/config/bsod-filters";
import { BSOD_EXPORT_COLUMNS, bsodRowsForExport } from "@/lib/export/bsod-columns";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";

const BSOD_EXPORT_MAX_ROWS = 2000;

/** Exporta inventário BSOD filtrado em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = await listPmeBsod({
      ...parseBsodSearchParams({
        filtro: sp.get("filtro") ?? undefined,
        saude: sp.get("saude") ?? undefined,
        cmts: sp.get("cmts") ?? undefined,
        node: sp.get("node") ?? undefined,
      }),
      limit: BSOD_EXPORT_MAX_ROWS,
    });

    const csv = rowsToCsv(bsodRowsForExport(rows), BSOD_EXPORT_COLUMNS);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildCsvFilename("bsod")}"`,
      },
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
