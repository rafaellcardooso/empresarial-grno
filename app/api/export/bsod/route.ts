import { NextRequest, NextResponse } from "next/server";
import {
  isBsodAlarmStatusFilter,
  isBsodTratativaFilter,
  parseBsodSearchParams,
} from "@/lib/config/bsod-filters";
import { BSOD_EXPORT_COLUMNS, bsodRowsForExport } from "@/lib/export/bsod-columns";
import { buildCsvFilename, rowsToCsv } from "@/lib/export/csv";
import { csvDownloadHeaders } from "@/lib/export/download";
import type { BsodFilters, BsodListScope } from "@/lib/queries/bsod";
import { listAllPmeBsodForExport } from "@/lib/queries/bsod";
import {
  listActiveBsodKeys,
  listActiveBsodKeysByChamadoStatus,
} from "@/lib/queries/tratativa-chamados";

export const dynamic = "force-dynamic";

/** Exporta inventário ou alarmes BSOD filtrados em CSV (requer sessão autenticada). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const scope: BsodListScope = sp.get("scope") === "alarms" ? "alarms" : "inventory";
    const filters = parseBsodSearchParams(
      {
        filtro: sp.get("filtro") ?? undefined,
        saude: sp.get("saude") ?? undefined,
        cmts: sp.get("cmts") ?? undefined,
        node: sp.get("node") ?? undefined,
        q: sp.get("q") ?? undefined,
        tratativa: sp.get("tratativa") ?? undefined,
        ddd: sp.get("ddd") ?? undefined,
        status: sp.get("status") ?? undefined,
      },
      { scope },
    );

    const tratativa = sp.get("tratativa") ?? undefined;
    if (isBsodTratativaFilter(tratativa)) {
      const macs = await listActiveBsodKeysByChamadoStatus(tratativa);
      if (macs.length === 0) {
        const csv = rowsToCsv([], BSOD_EXPORT_COLUMNS);
        const filename = buildCsvFilename("bsod");
        return new NextResponse(csv, {
          headers: csvDownloadHeaders(filename, 0),
        });
      }
      filters.macs = macs;
    }

    const status = sp.get("status") ?? undefined;
    if (scope === "alarms" && isBsodAlarmStatusFilter(status)) {
      const activeMacs = await listActiveBsodKeys();
      const scoped = applyExportAlarmStatus(filters, status, activeMacs);
      if (scoped.empty) {
        const csv = rowsToCsv([], BSOD_EXPORT_COLUMNS);
        const filename = buildCsvFilename("bsod");
        return new NextResponse(csv, {
          headers: csvDownloadHeaders(filename, 0),
        });
      }
      Object.assign(filters, scoped.filters);
    }

    const rows = await listAllPmeBsodForExport(filters);

    const csv = rowsToCsv(bsodRowsForExport(rows), BSOD_EXPORT_COLUMNS);
    const filename = buildCsvFilename(scope === "alarms" ? "bsod-alarmes" : "bsod");
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

/** Aplica filtro pendente / em tratativa na exportação de alarmes. */
function applyExportAlarmStatus(
  filters: BsodFilters,
  status: "pendente" | "em-tratativa",
  activeMacs: string[],
): { filters: BsodFilters; empty: boolean } {
  if (status === "pendente") {
    if (activeMacs.length === 0) return { filters, empty: false };
    return { filters: { ...filters, excludeMacs: activeMacs }, empty: false };
  }
  if (activeMacs.length === 0) return { filters, empty: true };
  return { filters: { ...filters, macs: activeMacs }, empty: false };
}
