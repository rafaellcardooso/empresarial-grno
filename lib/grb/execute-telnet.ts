import {
  GRB_COMMAND_VALUE_PREFIX_LENGTH,
  GRB_DEFAULT_TELNET_ARG0,
  isGrbCircuitIpValid,
} from "@/lib/config/grb";
import {
  buildNokiaVprnPingCommand,
  buildTelnetCommandValue,
  getTelnetCommandPreset,
  isNokiaVprnBgpPreset,
  isTelnetStaffPreset,
  telnetPresetCategory,
} from "@/lib/config/grb-telnet-commands";
import { isNokiaEqpto } from "@/lib/config/grb-telnet-catalog";
import { resolveRouterInstance, resolveVprnServiceId } from "@/lib/grb/telnet-vprn";
import { fetchGrbConsoleHtml } from "@/lib/grb/fetch-console-html";
import {
  buildGrbProxyUrl,
  extractGrbPageError,
  extractGrbProxyTokens,
} from "@/lib/grb/parse-console-html";
import { parseGrbProxyResponse } from "@/lib/grb/parse-proxy-response";
import { replaceTelnetPromptEcho } from "@/lib/grb/sanitize-telnet-output";
import { fetchGrbTelnetText, enrichGrbTelnetPermissionError } from "@/lib/grb/telnet-fetch";

export type GrbExecuteTelnetResult = {
  command: string;
  output: string;
};

export type GrbExecuteTelnetCommandInput = {
  grbBaseUrl: string;
  pageArg0?: string;
  eqpto: string;
  idRede: number;
  comando: string;
};

export type GrbExecuteTelnetPresetInput = {
  grbBaseUrl: string;
  pageArg0?: string;
  eqpto: string;
  idRede: number;
  commandPresetId: string;
  ipNetwork?: string;
  ipv6Network?: string;
  networkInterface?: string;
  vrfName?: string;
  vprnRouterInstance?: string;
  vprnServiceId?: string;
  word?: string;
};

/** @deprecated Use GrbExecuteTelnetPresetInput. */
export type GrbExecutePingPresetInput = GrbExecuteTelnetPresetInput;

/** Indica se a string parece um IPv6 válido (presença de colons). */
export function isGrbIpv6Valid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes(":")) return false;
  return /^[0-9a-fA-F:.]+$/.test(trimmed);
}

/** Carrega console GRB, executa comando via proxy e retorna saída telnet. */
export async function executeTelnetCommand(
  input: GrbExecuteTelnetCommandInput,
): Promise<GrbExecuteTelnetResult> {
  const eqpto = input.eqpto.trim().toUpperCase();
  const comando = input.comando.trim();
  if (!eqpto) throw new Error("Equipamento é obrigatório.");
  if (!comando) throw new Error("Comando telnet é obrigatório.");

  const consoleHtml = await fetchGrbConsoleHtml(input.grbBaseUrl, {
    eqpto,
    idRede: input.idRede,
    pageArg0: input.pageArg0,
  });

  const pageError = extractGrbPageError(consoleHtml);
  if (pageError) {
    throw new Error(enrichGrbTelnetPermissionError(pageError));
  }

  const tokens = extractGrbProxyTokens(consoleHtml);
  if (!tokens) {
    throw new Error("Não foi possível obter tokens do proxy GRB.");
  }

  const proxyUrl = buildGrbProxyUrl(input.grbBaseUrl, tokens, input.idRede, comando);
  const proxyBody = await fetchGrbTelnetText(proxyUrl);
  const command = comando.slice(GRB_COMMAND_VALUE_PREFIX_LENGTH);
  const output = replaceTelnetPromptEcho(parseGrbProxyResponse(proxyBody), command);

  return {
    command,
    output,
  };
}

/** Executa preset telnet com placeholders resolvidos. */
export async function executeTelnetPreset(
  input: GrbExecuteTelnetPresetInput,
): Promise<GrbExecuteTelnetResult> {
  const preset = getTelnetCommandPreset(input.commandPresetId);
  if (!preset) throw new Error("Comando telnet inválido.");

  const ipNetwork = input.ipNetwork?.trim() ?? "";
  const ipv6Network = input.ipv6Network?.trim() ?? "";
  const networkInterface = input.networkInterface?.trim() ?? "";
  const vrfName = input.vrfName?.trim() ?? "";
  const word = input.word?.trim() ?? "";
  const eqpto = input.eqpto.trim();

  if (preset.requiresIp && !isGrbCircuitIpValid(ipNetwork)) {
    throw new Error("Informe um IPv4 válido.");
  }
  if (preset.requiresIpv6 && !isGrbIpv6Valid(ipv6Network)) {
    throw new Error("Informe um IPv6 válido.");
  }
  if (preset.requiresInterface && !networkInterface) {
    throw new Error("Informe a interface.");
  }
  if (
    preset.requiresVrf &&
    !vrfName &&
    !input.vprnRouterInstance?.trim() &&
    !input.vprnServiceId?.trim()
  ) {
    throw new Error("Informe a VRF/VPRN.");
  }
  if (preset.requiresWord && !word) {
    throw new Error("Informe o campo WORD.");
  }

  let resolvedValue: string;
  const isNokiaPingWithVprn =
    telnetPresetCategory(preset) === "ping" && preset.requiresVrf && isNokiaEqpto(eqpto);
  const isNokiaBgpWithVprn = isNokiaEqpto(eqpto) && isNokiaVprnBgpPreset(preset.id);

  if (isNokiaPingWithVprn) {
    const instance = input.vprnRouterInstance?.trim() || resolveRouterInstance(vrfName);
    if (!instance) throw new Error("Informe o router-instance (VPRN).");

    ({ resolvedValue } = buildNokiaVprnPingCommand(preset, instance, {
      ipNetwork,
      networkInterface,
      word,
    }));
  } else if (isNokiaBgpWithVprn) {
    const serviceId =
      input.vprnServiceId?.trim() ||
      resolveVprnServiceId(vrfName || input.vprnRouterInstance || input.vprnServiceId || "");
    if (!serviceId) {
      throw new Error(
        "Informe o service-id VPRN (ex.: 7776), o nome (ex.: PRODUCTION:7776) ou selecione na lista.",
      );
    }

    ({ resolvedValue } = buildTelnetCommandValue(preset, {
      ipNetwork,
      vrfName: serviceId,
    }));
  } else {
    const vrfResolved =
      isNokiaEqpto(eqpto) && preset.requiresVrf
        ? input.vprnRouterInstance?.trim() || resolveRouterInstance(vrfName) || vrfName
        : vrfName;

    ({ resolvedValue } = buildTelnetCommandValue(preset, {
      ipNetwork,
      ipv6Network,
      networkInterface,
      vrfName: vrfResolved,
      word,
    }));
  }

  return executeTelnetCommand({
    grbBaseUrl: input.grbBaseUrl,
    pageArg0: input.pageArg0?.trim() || GRB_DEFAULT_TELNET_ARG0,
    eqpto,
    idRede: input.idRede,
    comando: resolvedValue,
  });
}

/** @deprecated Use executeTelnetPreset. */
export async function executePingPreset(
  input: GrbExecuteTelnetPresetInput,
): Promise<GrbExecuteTelnetResult> {
  return executeTelnetPreset(input);
}

/** @deprecated Use executeTelnetPreset. */
export async function executeGrbTelnet(
  input: GrbExecuteTelnetPresetInput,
): Promise<GrbExecuteTelnetResult> {
  return executeTelnetPreset(input);
}

/** Indica se o preset exige papel STAFF no servidor. */
export { isTelnetStaffPreset };
