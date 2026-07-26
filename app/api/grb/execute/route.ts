import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { GRB_DEFAULT_ID_REDE, isGrbCircuitIpValid } from "@/lib/config/grb";
import {
  getTelnetCommandPreset,
  isNokiaVprnBgpPreset,
  TELNET_DEFAULT_PING_PRESET_ID,
} from "@/lib/config/grb-telnet-commands";
import { presetNeedsVprnList } from "@/lib/config/grb-telnet-ui";
import { assertGrbTelnetAuthConfigured } from "@/lib/grb/telnet-fetch";
import { executeTelnetPreset, isGrbIpv6Valid, isTelnetStaffPreset } from "@/lib/grb/execute-telnet";

type GrbExecuteBody = {
  eqpto?: string;
  idRede?: number;
  ipNetwork?: string;
  ipv6Network?: string;
  networkInterface?: string;
  vrfName?: string;
  vprnRouterInstance?: string;
  vprnServiceId?: string;
  word?: string;
  commandPresetId?: string;
};

function parseExecuteBody(body: GrbExecuteBody) {
  const eqpto = body.eqpto?.trim();
  if (!eqpto) return { error: "Parâmetro eqpto é obrigatório." };

  const commandPresetId = body.commandPresetId?.trim() || TELNET_DEFAULT_PING_PRESET_ID;
  const preset = getTelnetCommandPreset(commandPresetId);
  if (!preset) return { error: "Comando telnet inválido." };

  const ipNetwork = body.ipNetwork?.trim() ?? "";
  const ipv6Network = body.ipv6Network?.trim() ?? "";
  const networkInterface = body.networkInterface?.trim() ?? "";
  const vrfName = body.vrfName?.trim() ?? "";
  const vprnRouterInstance = body.vprnRouterInstance?.trim() ?? "";
  const vprnServiceId = body.vprnServiceId?.trim() ?? "";
  const word = body.word?.trim() ?? "";

  if (preset.requiresIp && !isGrbCircuitIpValid(ipNetwork)) {
    return { error: "Informe um IPv4 válido." };
  }
  if (preset.requiresIpv6 && !isGrbIpv6Valid(ipv6Network)) {
    return { error: "Informe um IPv6 válido." };
  }
  if (preset.requiresInterface && !networkInterface) {
    return { error: "Informe a interface." };
  }
  if (preset.requiresVrf && !vrfName && !vprnRouterInstance && !vprnServiceId) {
    return { error: "Informe a VRF/VPRN." };
  }
  if (preset.requiresWord && !word) {
    return { error: "Informe o campo WORD." };
  }
  if (
    isNokiaVprnBgpPreset(preset.id) &&
    !vprnServiceId &&
    !/^\d+$/.test(vrfName) &&
    !/^\d+$/.test(vprnRouterInstance) &&
    !/:\d+$/.test(vrfName) &&
    !/:\d+$/.test(vprnRouterInstance)
  ) {
    return {
      error: "Informe o service-id, o nome VPRN (ex.: PRODUCTION:7776) ou selecione na lista.",
    };
  }
  if (
    presetNeedsVprnList(preset, eqpto) &&
    !isNokiaVprnBgpPreset(preset.id) &&
    !vprnRouterInstance &&
    !vrfName
  ) {
    return { error: "Informe o router-instance (VPRN)." };
  }

  const idRede = Number(body.idRede);
  return {
    data: {
      eqpto,
      idRede: Number.isFinite(idRede) ? idRede : GRB_DEFAULT_ID_REDE,
      ipNetwork,
      ipv6Network,
      networkInterface,
      vrfName,
      vprnRouterInstance,
      vprnServiceId,
      word,
      commandPresetId,
      preset,
    },
  };
}

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

  let body: GrbExecuteBody;
  try {
    body = (await request.json()) as GrbExecuteBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = parseExecuteBody(body);
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
