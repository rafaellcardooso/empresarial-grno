export type TelnetCommandCategory =
  | "ping"
  | "traceroute"
  | "interfaces"
  | "bgp"
  | "vrf"
  | "ospf"
  | "routing"
  | "multicast"
  | "arp"
  | "policy"
  | "wan"
  | "platform"
  | "show";

export type TelnetCommandPreset = {
  id: string;
  label: string;
  templateValue: string;
  category?: TelnetCommandCategory;
  requiresIp?: boolean;
  requiresIpv6?: boolean;
  requiresInterface?: boolean;
  requiresVrf?: boolean;
  requiresWord?: boolean;
  staffOnly?: boolean;
  nokiaOnly?: boolean;
  ciscoOnly?: boolean;
};

export type TelnetCommandField = "ip" | "ipv6" | "vrf" | "interface" | "word";

/** @deprecated Use TelnetCommandPreset. */
export type TelnetPingPreset = TelnetCommandPreset;

/** @deprecated Use TelnetCommandField. */
export type TelnetPingField = TelnetCommandField;

export type TelnetCommandBuildInput = {
  ipNetwork?: string;
  ipv6Network?: string;
  networkInterface?: string;
  vrfName?: string;
  word?: string;
};

/** @deprecated Use TelnetCommandBuildInput. */
export type TelnetPingBuildInput = TelnetCommandBuildInput;

export type TelnetCommandBuildResult = {
  display: string;
  resolvedValue: string;
};

/** @deprecated Use TelnetCommandBuildResult. */
export type TelnetPingBuildResult = TelnetCommandBuildResult;
