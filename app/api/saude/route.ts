import { NextResponse } from "next/server";
import { pingBsodDb } from "@/lib/queries/bsod";
import { pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Retorna status da API e ping dos bancos SIR (app + BSOD). */
export async function GET() {
  const sir = await pingSirDb();
  const bsod = await pingBsodDb();

  return NextResponse.json({
    status_api: "OK",
    servico: "Empresarial Next.js (SIR + BSOD)",
    conexao_db_sir: sir.ok ? "OK" : "ERRO",
    detalhe_db_sir: sir.detail,
    conexao_db_bsod: bsod.ok ? "OK" : "ERRO",
    detalhe_db_bsod: bsod.detail,
    // legado para clients que ainda leem a chave HFC
    conexao_db_hfc: bsod.ok ? "OK" : "ERRO",
    detalhe_db_hfc: bsod.detail,
  });
}
