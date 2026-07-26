import { GRB_COMMAND_VALUE_PREFIX_LENGTH } from "@/lib/config/grb";
import { CISCO_TELNET_COMMANDS } from "@/lib/config/grb-telnet-cisco-commands";
import { TELNET_STAFF_COMMANDS } from "@/lib/config/grb-telnet-staff-commands";
import type {
  TelnetCommandBuildInput,
  TelnetCommandBuildResult,
  TelnetCommandCategory,
  TelnetCommandField,
  TelnetCommandPreset,
} from "@/lib/config/grb-telnet-types";

export type {
  TelnetCommandBuildInput,
  TelnetCommandBuildResult,
  TelnetCommandCategory,
  TelnetCommandField,
  TelnetCommandPreset,
  TelnetPingBuildInput,
  TelnetPingBuildResult,
  TelnetPingField,
  TelnetPingPreset,
} from "@/lib/config/grb-telnet-types";

/** Presets de ping espelhados do sel_cmds do executar_comandos_telnet.php. */
export const TELNET_PING_PRESETS: readonly TelnetCommandPreset[] = [
  {
    id: "ping-ip",
    label: "ping (IP)",
    category: "ping",
    templateValue: "ISvotmping (IP)",
    requiresIp: true,
  },
  {
    id: "ping-ip-source-interface",
    label: "ping (IP) source (INTERFACE)",
    category: "ping",
    templateValue: "ISvotmping (IP) source (INTERFACE)",
    requiresIp: true,
    requiresInterface: true,
  },
  {
    id: "ping-vrf-vrf-ip",
    label: "ping vrf (VRF) (IP)",
    category: "ping",
    templateValue: "ISvotmping vrf (VRF) (IP)",
    requiresIp: true,
    requiresVrf: true,
  },
  {
    id: "ping-vrf-vrf-ip-word",
    label: "ping vrf (VRF) (IP) (WORD)",
    category: "ping",
    templateValue: "ISvotmping vrf (VRF) (IP) (WORD)",
    requiresIp: true,
    requiresVrf: true,
    requiresWord: true,
  },
];

export const TELNET_COMMAND_PRESETS: readonly TelnetCommandPreset[] = [
  ...TELNET_PING_PRESETS,
  ...TELNET_STAFF_COMMANDS,
  ...CISCO_TELNET_COMMANDS,
];

const PRESET_BY_ID = new Map(TELNET_COMMAND_PRESETS.map((preset) => [preset.id, preset]));

export const TELNET_DEFAULT_PING_PRESET_ID = "ping-ip";

/** Retorna preset telnet pelo id ou undefined. */
export function getTelnetCommandPreset(presetId: string): TelnetCommandPreset | undefined {
  return PRESET_BY_ID.get(presetId);
}

/** @deprecated Use getTelnetCommandPreset. */
export function getTelnetPingPreset(presetId: string): TelnetCommandPreset | undefined {
  return getTelnetCommandPreset(presetId);
}

/** Indica se o preset é exclusivo STAFF. */
export function isTelnetStaffPreset(preset: TelnetCommandPreset): boolean {
  return preset.staffOnly === true;
}

/** Categoria do preset (default ping). */
export function telnetPresetCategory(preset: TelnetCommandPreset): TelnetCommandCategory {
  return preset.category ?? "ping";
}

/** Lista campos a coletar na ordem padrão Cisco. */
export function fieldsForTelnetPreset(preset: TelnetCommandPreset): TelnetCommandField[] {
  const fields: TelnetCommandField[] = [];
  if (preset.requiresIp) fields.push("ip");
  if (preset.requiresIpv6) fields.push("ipv6");
  if (preset.requiresVrf) fields.push("vrf");
  if (preset.requiresInterface) fields.push("interface");
  if (preset.requiresWord) fields.push("word");
  return fields;
}

/** @deprecated Use fieldsForTelnetPreset. */
export function fieldsForPingPreset(preset: TelnetCommandPreset): TelnetCommandField[] {
  return fieldsForTelnetPreset(preset);
}

/** Monta valor bruto sel_cmds e comando exibido após substituir placeholders. */
export function buildTelnetCommandValue(
  preset: TelnetCommandPreset,
  input: TelnetCommandBuildInput,
): TelnetCommandBuildResult {
  let comando = preset.templateValue;
  const networkInterface = input.networkInterface?.trim() ?? "";
  const vrfName = input.vrfName?.trim() ?? "";
  const ipNetwork = input.ipNetwork?.trim() ?? "";
  const ipv6Network = input.ipv6Network?.trim() ?? "";
  const word = input.word?.trim() ?? "";

  if (networkInterface) comando = comando.replaceAll("(INTERFACE)", networkInterface);
  if (vrfName) comando = comando.replaceAll("(VRF)", vrfName);
  if (ipNetwork) comando = comando.replaceAll("(IP)", ipNetwork);
  if (ipv6Network) comando = comando.replaceAll("(IPv6)", ipv6Network);
  if (word) comando = comando.replaceAll("(WORD)", word);

  const missing: string[] = [];
  if (comando.includes("(INTERFACE)")) missing.push("interface");
  if (comando.includes("(VRF)")) missing.push("vrf");
  if (comando.includes("(IP)")) missing.push("ip");
  if (comando.includes("(IPv6)")) missing.push("ipv6");
  if (comando.includes("(WORD)")) missing.push("word");
  if (missing.length > 0) {
    throw new Error(`Comando incompleto: faltam ${missing.join(", ")}.`);
  }

  return {
    display: comando.slice(GRB_COMMAND_VALUE_PREFIX_LENGTH),
    resolvedValue: comando,
  };
}

/** @deprecated Use buildTelnetCommandValue. */
export function buildPingCommandValue(
  preset: TelnetCommandPreset,
  input: TelnetCommandBuildInput,
): TelnetCommandBuildResult {
  return buildTelnetCommandValue(preset, input);
}

/** IDs de BGP Nokia com VPRN na posição show router {service-id} bgp …. */
export const NOKIA_BGP_VPRN_PRESET_IDS: readonly string[] = [
  "nokia-bgp-vrf-neighbor-ipv4-received",
  "nokia-bgp-vrf-neighbor-ipv4-advertised",
];

/** Indica preset BGP Nokia com VPRN (service-id após show router). */
export function isNokiaVprnBgpPreset(presetId: string): boolean {
  return NOKIA_BGP_VPRN_PRESET_IDS.includes(presetId);
}

/** Monta ping VPRN no formato Nokia SR OS: ping IP router-instance NAME. */
export function buildNokiaVprnPingCommand(
  preset: TelnetCommandPreset,
  routerInstance: string,
  input: TelnetCommandBuildInput,
): TelnetCommandBuildResult {
  const instance = routerInstance.trim();
  const ip = input.ipNetwork?.trim() ?? "";
  const word = input.word?.trim() ?? "";

  if (!instance) throw new Error("Router-instance VPRN é obrigatório.");
  if (preset.requiresIp && !ip) throw new Error("Informe o IPv4 ou IPv6 de destino.");

  const raw =
    preset.id === "ping-vrf-vrf-ip-word" && word
      ? `ISvotmping ${ip} router-instance ${instance} count ${word}`
      : `ISvotmping ${ip} router-instance ${instance}`;

  return {
    display: raw.slice(GRB_COMMAND_VALUE_PREFIX_LENGTH),
    resolvedValue: raw,
  };
}
