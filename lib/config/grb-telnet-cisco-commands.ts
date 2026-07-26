import { GRB_COMMAND_PRESETS, isGrbPingCommandPreset } from "@/lib/config/grb";
import type { GrbCommandPreset } from "@/lib/config/grb-types";
import type { TelnetCommandCategory, TelnetCommandPreset } from "@/lib/config/grb-telnet-types";

/** Ordem das categorias Cisco no select da UI. */
export const CISCO_TELNET_CATEGORY_ORDER: readonly TelnetCommandCategory[] = [
  "ping",
  "traceroute",
  "interfaces",
  "bgp",
  "vrf",
  "ospf",
  "routing",
  "multicast",
  "arp",
  "policy",
  "wan",
  "platform",
  "show",
];

/** Rótulos das categorias Cisco IOS no fluxo TELNET. */
export const CISCO_TELNET_CATEGORY_LABELS: Record<TelnetCommandCategory, string> = {
  ping: "Ping",
  traceroute: "Traceroute",
  interfaces: "Interfaces",
  bgp: "BGP",
  vrf: "VRF",
  ospf: "OSPF",
  routing: "Rotas / CEF",
  multicast: "Multicast (PIM / MFIB)",
  arp: "ARP",
  policy: "Políticas (ACL / maps)",
  wan: "WAN / controllers",
  platform: "Plataforma / hardware",
  show: "Show (geral)",
};

/** Infere categoria hierárquica a partir do rótulo GRB legado. */
export function categorizeCiscoGrbCommand(preset: GrbCommandPreset): TelnetCommandCategory {
  const label = preset.label.toLowerCase();
  const id = preset.id.toLowerCase();

  if (id.startsWith("ping-") || label.startsWith("ping ")) return "ping";
  if (id.startsWith("traceroute-") || label.startsWith("traceroute")) return "traceroute";
  if (label.includes(" bgp ") || label.startsWith("show bgp") || label.includes("show ip bgp")) {
    return "bgp";
  }
  if (label.includes("interface") || label.includes("running interface")) return "interfaces";
  if (label.includes(" vrf ") || label.includes("vrf (")) return "vrf";
  if (label.includes("ospf")) return "ospf";
  if (label.includes(" pim ") || label.includes("mfib")) return "multicast";
  if (label.includes(" arp")) return "arp";
  if (label.includes(" route") || label.includes(" cef")) return "routing";
  if (
    label.includes("access-list") ||
    label.includes("prefix-list") ||
    label.includes("community-list") ||
    label.includes("extcommunity-list") ||
    label.includes("route-map") ||
    label.includes("policy-map") ||
    label.includes("class-map")
  ) {
    return "policy";
  }
  if (
    label.includes("frame-relay") ||
    label.includes(" atm") ||
    label.includes("ppp multilink") ||
    label.includes("controllers")
  ) {
    return "wan";
  }
  if (
    label.includes("version") ||
    label.includes("logging") ||
    label.includes("diag") ||
    label.includes("environment") ||
    label.includes("redundancy") ||
    label.includes("gsr") ||
    label.includes(" led") ||
    label.includes("context") ||
    label.includes("configuration")
  ) {
    return "platform";
  }

  return "show";
}

/** Converte preset GRB legado em preset telnet Cisco IOS. */
export function grbPresetToCiscoTelnetPreset(preset: GrbCommandPreset): TelnetCommandPreset {
  return {
    id: preset.id,
    label: preset.label,
    templateValue: preset.templateValue,
    category: categorizeCiscoGrbCommand(preset),
    requiresIp: preset.requiresIp,
    requiresInterface: preset.requiresInterface,
    requiresVrf: preset.requiresVrf,
    requiresWord: preset.requiresWord,
    staffOnly: !isGrbPingCommandPreset(preset),
    ciscoOnly: true,
  };
}

/** Comandos telnet GRB legados (sel_cmds) para equipamentos Cisco IOS. */
export const CISCO_TELNET_COMMANDS: readonly TelnetCommandPreset[] = GRB_COMMAND_PRESETS.map(
  grbPresetToCiscoTelnetPreset,
);

/** Lista presets Cisco visíveis conforme papel do usuário. */
export function ciscoTelnetCommandsForRole(role: string): TelnetCommandPreset[] {
  if (role === "STAFF") return [...CISCO_TELNET_COMMANDS];
  return CISCO_TELNET_COMMANDS.filter((preset) => !preset.staffOnly);
}
