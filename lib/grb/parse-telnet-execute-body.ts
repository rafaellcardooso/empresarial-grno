import { GRB_DEFAULT_ID_REDE, isGrbCircuitIpValid } from "@/lib/config/grb";
import {
  getTelnetCommandPreset,
  isNokiaVprnBgpPreset,
  TELNET_DEFAULT_PING_PRESET_ID,
} from "@/lib/config/grb-telnet-commands";
import type { TelnetCommandPreset } from "@/lib/config/grb-telnet-types";
import { presetNeedsVprnList } from "@/lib/config/grb-telnet-ui";
import { isGrbIpv6Valid } from "@/lib/grb/execute-telnet";

export type GrbTelnetExecuteBody = {
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

export type GrbTelnetExecuteParsed = {
  eqpto: string;
  idRede: number;
  ipNetwork: string;
  ipv6Network: string;
  networkInterface: string;
  vrfName: string;
  vprnRouterInstance: string;
  vprnServiceId: string;
  word: string;
  commandPresetId: string;
  preset: TelnetCommandPreset;
};

/** Valida body JSON de POST /api/grb/execute e normaliza campos do preset. */
export function parseTelnetExecuteBody(
  body: GrbTelnetExecuteBody,
): { data: GrbTelnetExecuteParsed } | { error: string } {
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
