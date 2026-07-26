import { NextResponse } from "next/server";
import { GRB_DEFAULT_ID_REDE } from "@/lib/config/grb";
import { assertGrbTelnetAuthConfigured } from "@/lib/grb/telnet-fetch";
import { executeTelnetCommand } from "@/lib/grb/execute-telnet";
import { parseVprnEntries, SHOW_VPRN_COMMAND } from "@/lib/grb/telnet-vprn";

/** Lista serviços VPRN do equipamento Nokia via show service service-using vprn. */
export async function GET(request: Request) {
  const grbBaseUrl = process.env.GRB_BASE_URL?.trim();
  if (!grbBaseUrl) {
    return NextResponse.json({ error: "GRB não configurado." }, { status: 503 });
  }

  try {
    assertGrbTelnetAuthConfigured();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GRB telnet não configurado." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const eqpto = searchParams.get("eqpto")?.trim();
  if (!eqpto) {
    return NextResponse.json({ error: "Parâmetro eqpto é obrigatório." }, { status: 400 });
  }

  const idRede = Number(searchParams.get("id_rede"));
  const resolvedIdRede = Number.isFinite(idRede) ? idRede : GRB_DEFAULT_ID_REDE;

  try {
    const result = await executeTelnetCommand({
      grbBaseUrl,
      pageArg0: process.env.GRB_TELNET_ARG0,
      eqpto,
      idRede: resolvedIdRede,
      comando: SHOW_VPRN_COMMAND,
    });

    const entries = parseVprnEntries(result.output);
    return NextResponse.json({ entries, rawOutput: result.output });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo esgotado aguardando resposta do GRB."
        : error instanceof Error
          ? error.message
          : "Falha ao consultar VPRN no GRB.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
