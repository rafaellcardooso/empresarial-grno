import { NextRequest, NextResponse } from "next/server";
import {
  parseSdhDddParam,
  parseSdhSearchParam,
  parseSdhStatusParam,
  parseSdhVendorParam,
} from "@/lib/config/sdh-filters";
import { sdhLimitFromParam, sdhListOffset, sdhPageFromParam } from "@/lib/config/sdh-pagination";
import {
  countActiveSdhAlarms,
  countSdhByDdd,
  countSdhByStatus,
  countSdhByVendor,
  listActiveSdhAlarms,
} from "@/lib/queries/sdh";
import { pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Lista alarmes SDH ativos com filtros `vendor` e `ddd`. */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const vendor = parseSdhVendorParam(sp.get("vendor"));
    const ddd = parseSdhDddParam(sp.get("ddd") ?? undefined);
    const status = parseSdhStatusParam(sp.get("status"));
    const q = parseSdhSearchParam(sp.get("q"));
    const page = sdhPageFromParam(sp.get("page"));
    const limit = sdhLimitFromParam(sp.get("limit"));
    const filters = {
      vendor,
      ddd,
      status,
      q,
      limit,
      offset: sdhListOffset(page, limit),
    };

    const [data, total, vendorCounts, dddCounts, statusCounts] = await Promise.all([
      listActiveSdhAlarms(filters),
      countActiveSdhAlarms(filters),
      countSdhByVendor({ ddd, q }),
      countSdhByDdd({ vendor, q }),
      countSdhByStatus({ vendor, ddd, q }),
    ]);

    return NextResponse.json({
      status: "sucesso",
      total_registros: total,
      pagina: page,
      por_pagina: limit,
      vendor_counts: vendorCounts,
      ddd_counts: dddCounts,
      status_counts: statusCounts,
      data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro",
        mensagem: "Falha ao acessar o banco de dados.",
        detalhe: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

/** Verifica conectividade MySQL SIR (HEAD para monitoramento). */
export async function HEAD() {
  const ping = await pingSirDb();
  return new NextResponse(null, { status: ping.ok ? 200 : 503 });
}
