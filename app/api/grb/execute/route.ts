import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { executeTelnetPreset, isTelnetStaffPreset } from "@/lib/grb/execute-telnet";
import {
  parseTelnetExecuteBody,
  type GrbTelnetExecuteBody,
} from "@/lib/grb/parse-telnet-execute-body";
import { assertGrbTelnetAuthConfigured } from "@/lib/grb/telnet-fetch";

/** Executa preset telnet no GRB e devolve comando e saída. */
export async function POST(request: Request) {
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

  let body: GrbTelnetExecuteBody;
  try {
    body = (await request.json()) as GrbTelnetExecuteBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = parseTelnetExecuteBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const session = await getSession();
  if (isTelnetStaffPreset(parsed.data.preset) && session?.role !== "STAFF") {
    return NextResponse.json({ error: "Comando não permitido para seu perfil." }, { status: 403 });
  }

  try {
    const result = await executeTelnetPreset({
      grbBaseUrl,
      pageArg0: process.env.GRB_TELNET_ARG0,
      eqpto: parsed.data.eqpto,
      idRede: parsed.data.idRede,
      ipNetwork: parsed.data.ipNetwork,
      ipv6Network: parsed.data.ipv6Network,
      networkInterface: parsed.data.networkInterface,
      vrfName: parsed.data.vrfName,
      vprnRouterInstance: parsed.data.vprnRouterInstance,
      vprnServiceId: parsed.data.vprnServiceId,
      word: parsed.data.word,
      commandPresetId: parsed.data.commandPresetId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo esgotado aguardando resposta do GRB."
        : error instanceof Error
          ? error.message
          : "Falha ao executar comando no GRB.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
