import { NextResponse } from "next/server";
import { listActiveRals, pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";

/** Lista RALs ativas em JSON. */
export async function GET() {
  try {
    const data = await listActiveRals();
    return NextResponse.json({
      status: "sucesso",
      total_registros: data.length,
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
