import { isNokiaEqpto } from "@/lib/config/grb-telnet-catalog";
import {
  CISCO_TELNET_CATEGORY_LABELS,
  CISCO_TELNET_CATEGORY_ORDER,
  ciscoTelnetCommandsForRole,
} from "@/lib/config/grb-telnet-cisco-commands";
import { resolveVprnServiceId } from "@/lib/grb/telnet-vprn";
import { TELNET_STAFF_COMMANDS } from "@/lib/config/grb-telnet-staff-commands";
import {
  buildTelnetCommandValue,
  fieldsForTelnetPreset,
  getTelnetCommandPreset,
  isNokiaVprnBgpPreset,
  isTelnetStaffPreset,
  TELNET_PING_PRESETS,
  telnetPresetCategory,
  type TelnetCommandCategory,
  type TelnetCommandField,
  type TelnetCommandPreset,
} from "@/lib/config/grb-telnet-commands";

export type { TelnetCommandField, TelnetCommandPreset };
/** @deprecated Use TelnetCommandField. */
export type TelnetPingField = TelnetCommandField;

/** Presets exibidos em eqptos Nokia (omitidos os exclusivos Cisco IOS). */
export const NOKIA_PING_PRESET_IDS: readonly string[] = [
  "ping-ip",
  "ping-vrf-vrf-ip",
  "ping-vrf-vrf-ip-word",
];

export const NOKIA_PRESET_LABELS: Record<string, string> = {
  "ping-ip": "ping (IP)",
  "ping-vrf-vrf-ip": "ping (IP) router-instance (VPRN)",
  "ping-vrf-vrf-ip-word": "ping (IP) router-instance (VPRN) count (N)",
};

export const TELNET_CATEGORY_LABELS: Record<TelnetCommandCategory, string> = {
  ...CISCO_TELNET_CATEGORY_LABELS,
  interfaces: "Interfaces",
  bgp: "BGP",
};

export const FIELD_LABELS: Record<TelnetCommandField, string> = {
  ip: "IPv4 do vizinho / destino",
  ipv6: "IPv6 do vizinho",
  vrf: "VRF / VPRN",
  interface: "Interface",
  word: "WORD / count",
};

export const FIELD_PROMPTS_DEFAULT: Record<TelnetCommandField, string> = {
  ip: "Informe o IPv4 de destino ou do vizinho BGP.",
  ipv6: "Informe o IPv6 do vizinho BGP.",
  vrf: "Informe o nome da VRF.",
  interface: "Informe a interface.",
  word: "Informe o parâmetro WORD.",
};

export const FIELD_PROMPTS_NOKIA: Record<TelnetCommandField, string> = {
  ip: "Informe o IPv4 de destino ou do vizinho BGP.",
  ipv6: "Informe o IPv6 do vizinho BGP.",
  vrf: "Escolha na lista ou informe o VPRN (router-instance).",
  interface: "Informe a interface.",
  word: "Informe a quantidade de pacotes (count).",
};

export type TelnetCommandGroup = {
  category: TelnetCommandCategory;
  label: string;
  presets: TelnetCommandPreset[];
};

/** Lista presets de ping exibidos para o equipamento. */
export function pingPresetsForEqpto(eqpto: string): TelnetCommandPreset[] {
  if (isNokiaEqpto(eqpto)) {
    const allowed = new Set(NOKIA_PING_PRESET_IDS);
    return TELNET_PING_PRESETS.filter((preset) => allowed.has(preset.id));
  }
  return [...TELNET_PING_PRESETS];
}

/** Lista presets disponíveis conforme papel, equipamento e plataforma. */
export function telnetCommandsForRoleAndEqpto(role: string, eqpto: string): TelnetCommandPreset[] {
  if (!isNokiaEqpto(eqpto)) {
    return ciscoTelnetCommandsForRole(role);
  }

  const isStaff = role === "STAFF";
  const ping = pingPresetsForEqpto(eqpto);

  if (!isStaff) return ping;

  const staffFiltered = TELNET_STAFF_COMMANDS.filter((preset) => preset.nokiaOnly !== false);

  return [...ping, ...staffFiltered];
}

/** Agrupa presets por categoria para o select da UI. */
export function telnetCommandGroupsForRoleAndEqpto(
  role: string,
  eqpto: string,
): TelnetCommandGroup[] {
  const presets = telnetCommandsForRoleAndEqpto(role, eqpto);
  const order: TelnetCommandCategory[] = isNokiaEqpto(eqpto)
    ? ["ping", "interfaces", "bgp"]
    : [...CISCO_TELNET_CATEGORY_ORDER];
  const grouped = new Map<TelnetCommandCategory, TelnetCommandPreset[]>();

  for (const preset of presets) {
    const category = telnetPresetCategory(preset);
    const list = grouped.get(category) ?? [];
    list.push(preset);
    grouped.set(category, list);
  }

  return order
    .filter((category) => grouped.has(category))
    .map((category) => ({
      category,
      label: TELNET_CATEGORY_LABELS[category],
      presets: grouped.get(category) ?? [],
    }));
}

/** Rótulo amigável do preset conforme a plataforma. */
export function presetUiLabel(preset: TelnetCommandPreset, eqpto: string): string {
  if (isNokiaEqpto(eqpto)) {
    return NOKIA_PRESET_LABELS[preset.id] ?? preset.label;
  }
  return preset.label;
}

/** Texto curto solicitando o campo no formulário. */
export function fieldPrompt(field: TelnetCommandField, eqpto: string): string {
  const prompts = isNokiaEqpto(eqpto) ? FIELD_PROMPTS_NOKIA : FIELD_PROMPTS_DEFAULT;
  return prompts[field];
}

/** Rótulo do campo conforme preset (ping aceita IPv4 ou IPv6 no campo ip). */
export function fieldLabelForPreset(
  field: TelnetCommandField,
  preset: TelnetCommandPreset,
): string {
  if (field === "ip" && telnetPresetCategory(preset) === "ping") {
    return "IP de destino";
  }
  return FIELD_LABELS[field];
}

/** Prompt do campo conforme preset e equipamento. */
export function fieldPromptForPreset(
  field: TelnetCommandField,
  eqpto: string,
  preset: TelnetCommandPreset,
): string {
  if (field === "ip" && telnetPresetCategory(preset) === "ping") {
    return "Informe o IPv4 ou IPv6 de destino.";
  }
  return fieldPrompt(field, eqpto);
}

/** Texto do campo VPRN conforme preset (ping usa nome; BGP usa service-id). */
export function vrfFieldPrompt(preset: TelnetCommandPreset, eqpto: string): string {
  if (isNokiaEqpto(eqpto) && isNokiaVprnBgpPreset(preset.id)) {
    return "Escolha na lista ou informe o VPRN; o comando usa o service-id (ex.: 7776).";
  }
  return fieldPrompt("vrf", eqpto);
}

/** Ordem dos campos no formulário; Nokia pede VPRN antes do IP quando aplicável. */
export function fieldsForEqpto(preset: TelnetCommandPreset, eqpto: string): TelnetCommandField[] {
  if (isNokiaEqpto(eqpto) && preset.requiresVrf) {
    const fields: TelnetCommandField[] = ["vrf"];
    if (preset.requiresIp) fields.push("ip");
    if (preset.requiresIpv6) fields.push("ipv6");
    if (preset.requiresInterface) fields.push("interface");
    if (preset.requiresWord) fields.push("word");
    return fields;
  }
  return fieldsForTelnetPreset(preset);
}

export type TelnetCommandPreviewInput = {
  presetId: string;
  eqpto: string;
  ip?: string;
  ipv6?: string;
  vrf?: string;
  vprnRouterInstance?: string;
  vprnServiceId?: string;
  interface?: string;
  word?: string;
};

/** @deprecated Use TelnetCommandPreviewInput. */
export type TelnetPingPreviewInput = TelnetCommandPreviewInput;

/** Monta preview do comando telnet (placeholders quando faltar dado). */
export function previewTelnetCommand(input: TelnetCommandPreviewInput): string {
  const preset = getTelnetCommandPreset(input.presetId);
  if (!preset) return input.presetId;

  const ipVal = input.ip?.trim() || "(IP)";
  const ipv6Val = input.ipv6?.trim() || "(IPv6)";
  const vprnVal = (input.vprnRouterInstance || input.vrf)?.trim() || "(VRF)";
  const wordVal = input.word?.trim() || "(N)";
  const ifaceVal = input.interface?.trim() || "(INTERFACE)";

  if (telnetPresetCategory(preset) === "ping" && isNokiaEqpto(input.eqpto) && preset.requiresVrf) {
    if (preset.id === "ping-vrf-vrf-ip-word") {
      return `ping ${ipVal} router-instance ${vprnVal} count ${wordVal}`;
    }
    return `ping ${ipVal} router-instance ${vprnVal}`;
  }

  if (
    telnetPresetCategory(preset) === "ping" &&
    isNokiaEqpto(input.eqpto) &&
    preset.id === "ping-ip"
  ) {
    return `ping ${ipVal}`;
  }

  if (isNokiaEqpto(input.eqpto) && isNokiaVprnBgpPreset(preset.id)) {
    const serviceIdVal =
      input.vprnServiceId?.trim() ||
      resolveVprnServiceId(input.vprnRouterInstance || input.vrf || "");
    const suffix =
      preset.id === "nokia-bgp-vrf-neighbor-ipv4-advertised"
        ? "advertised-routes"
        : "received-routes";
    return `show router ${serviceIdVal || "(VRF)"} bgp neighbor ${ipVal} ${suffix}`;
  }

  try {
    const vrfForBuild =
      isNokiaEqpto(input.eqpto) && preset.requiresVrf && !isNokiaVprnBgpPreset(preset.id)
        ? input.vprnRouterInstance || input.vrf || "(VRF)"
        : input.vrf || "(VRF)";

    const { display } = buildTelnetCommandValue(preset, {
      ipNetwork: input.ip || "(IP)",
      ipv6Network: input.ipv6 || "(IPv6)",
      networkInterface: ifaceVal,
      vrfName: vrfForBuild,
      word: input.word || "(WORD)",
    });
    return display;
  } catch {
    return presetUiLabel(preset, input.eqpto);
  }
}

/** @deprecated Use previewTelnetCommand. */
export function previewPingCommand(input: TelnetCommandPreviewInput): string {
  return previewTelnetCommand(input);
}

/** Indica se o preset exige lista VPRN Nokia (ping ou BGP com VRF). */
export function presetNeedsVprnList(preset: TelnetCommandPreset, eqpto: string): boolean {
  return isNokiaEqpto(eqpto) && preset.requiresVrf === true;
}

/** Indica se o preset exige confirmação STAFF no servidor. */
export function presetRequiresStaff(preset: TelnetCommandPreset): boolean {
  return isTelnetStaffPreset(preset);
}
