import { NextResponse } from "next/server";
import { pingHfcDb } from "@/lib/queries/bsod";
import { pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Retorna status da API e ping dos bancos SIR e hfc-sls. */
export async function GET() {
  const sir = await pingSirDb();
  const hfc = await pingHfcDb();

  return NextResponse.json({
    status_api: "OK",
    servico: "Empresarial Next.js (SIR + BSOD)",
    conexao_db_sir: sir.ok ? "OK" : "ERRO",
    detalhe_db_sir: sir.detail,
    conexao_db_hfc: hfc.ok ? "OK" : "ERRO",
    detalhe_db_hfc: hfc.detail,
  });
}
