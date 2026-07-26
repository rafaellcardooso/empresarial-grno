import type { GrbCommandPreset } from "@/lib/config/grb-types";
import { GRB_COMMAND_PRESETS } from "@/lib/config/grb-commands";

export type { GrbCommandPreset };
export { GRB_COMMAND_PRESETS };

export type GrbEquipmentPreset = {
  value: string;
  label: string;
};

export type GrbTelnetPageParams = {
  baseUrl: string;
  arg0: string;
  eqpto: string;
  idRede: number;
  ipNetwork?: string;
  networkInterface?: string;
  vrfName?: string;
  word?: string;
  /** Valor bruto de sel_cmds (ex.: ISvotmping (IP)). */
  selCmds?: string;
  /** Valor resolvido do hidden comando após substituir placeholders. */
  comando?: string;
};

export type GrbRecentTest = {
  eqpto: string;
  idRede: number;
  ipNetwork: string;
  networkInterface: string;
  vrfName: string;
  word: string;
  commandPresetId: string;
  openedAt: string;
};

/** Equipamentos frequentes no console telnet GRB (SLS). */
export const GRB_EQUIPMENT_PRESETS: GrbEquipmentPreset[] = [
  { value: "AGG01.SLS", label: "AGG01.SLS" },
  { value: "AGG02.SLS", label: "AGG02.SLS" },
];

export const GRB_CUSTOM_EQUIPMENT_VALUE = "__custom__";

export const GRB_CUSTOM_INTERFACE_VALUE = "__custom_interface__";

export const GRB_INTERFACE_EMPTY_VALUE = "";

export const GRB_RECENT_TESTS_KEY = "grb-recent-tests";

export const GRB_RECENT_TESTS_LIMIT = 5;

export const GRB_DEFAULT_COMMAND_PRESET_ID = "ping-ip";

/** Presets de ping disponíveis para usuários não staff. */
export const GRB_PING_COMMAND_PRESET_IDS = [
  "ping-ip",
  "ping-ip-source-interface",
  "ping-vrf-vrf-ip",
  "ping-vrf-vrf-ip-word",
  "ping-vrf-vrf-ip-source-interface",
] as const;

/** Indica se o preset é um comando ping (permitido a todos os usuários autenticados). */
export function isGrbPingCommandPreset(preset: GrbCommandPreset): boolean {
  return (GRB_PING_COMMAND_PRESET_IDS as readonly string[]).includes(preset.id);
}

/** Retorna presets de comando visíveis conforme perfil do usuário. */
export function getGrbCommandPresetsForRole(role: string): GrbCommandPreset[] {
  if (role === "STAFF") return GRB_COMMAND_PRESETS;
  return GRB_COMMAND_PRESETS.filter(isGrbPingCommandPreset);
}

/** Valor padrão de arg0 na carga de executar_comandos_telnet.php. */
export const GRB_DEFAULT_TELNET_ARG0 = "_]C<>:<;@>";

/** Valor fixo de id_rede enviado ao console telnet GRB. */
export const GRB_DEFAULT_ID_REDE = 0;

/** Prefixo removido pelo GRB antes de exibir o comando (filtro_comandos). */
export const GRB_COMMAND_VALUE_PREFIX_LENGTH = 6;

export type GrbCommandBuildInput = {
  preset: GrbCommandPreset;
  ipNetwork: string;
  networkInterface: string;
  vrfName: string;
  word: string;
};

export type GrbCommandBuildResult = {
  display: string;
  resolvedValue: string;
  ready: boolean;
  missing: Array<"ip" | "interface" | "vrf" | "word">;
};

/** Monta query string compartilhada entre URL direta e proxy interno. */
function appendGrbTelnetQueryParams(url: URL, params: GrbTelnetPageParams): void {
  url.searchParams.set("arg0", params.arg0);
  url.searchParams.set("id_rede", String(params.idRede));
  url.searchParams.set("eqpto", params.eqpto);
  url.searchParams.set("tcos", String(Date.now()));

  if (params.ipNetwork?.trim()) {
    url.searchParams.set("ip_network", params.ipNetwork.trim());
  }

  if (params.networkInterface?.trim()) {
    url.searchParams.set("interface", params.networkInterface.trim());
  }

  if (params.vrfName?.trim()) {
    url.searchParams.set("vrf_name", params.vrfName.trim());
  }

  if (params.word?.trim()) {
    url.searchParams.set("word", params.word.trim());
  }

  if (params.selCmds?.trim()) {
    url.searchParams.set("sel_cmds", params.selCmds.trim());
  }

  if (params.comando?.trim()) {
    url.searchParams.set("comando", params.comando.trim());
  }
}

/** Monta URL de carga do executar_comandos_telnet.php (campos espelham o formulário GRB). */
export function buildGrbTelnetPageUrl(params: GrbTelnetPageParams): string {
  const base = params.baseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/executar_comandos_telnet.php`);
  appendGrbTelnetQueryParams(url, params);
  return url.toString();
}

/** Monta rota interna que injeta sel_cmds e demais campos no HTML do GRB. */
export function buildGrbConsoleProxyPath(params: GrbTelnetPageParams): string {
  const url = new URL("http://local/api/grb/console");
  appendGrbTelnetQueryParams(url, params);
  return `${url.pathname}${url.search}`;
}

/** Resolve placeholders (INTERFACE), (VRF), (IP) e (WORD) como filtro_comandos no GRB. */
export function buildGrbCommandPreview(input: GrbCommandBuildInput): GrbCommandBuildResult {
  let comando = input.preset.templateValue;
  const missing: GrbCommandBuildResult["missing"] = [];

  const networkInterface = input.networkInterface.trim();
  const vrfName = input.vrfName.trim();
  const ipNetwork = input.ipNetwork.trim();
  const word = input.word.trim();

  if (networkInterface) {
    comando = comando.replaceAll("(INTERFACE)", networkInterface);
  }

  if (vrfName) {
    comando = comando.replaceAll("(VRF)", vrfName);
  }

  if (ipNetwork) {
    comando = comando.replaceAll("(IP)", ipNetwork);
  }

  if (word) {
    comando = comando.replaceAll("(WORD)", word);
  }

  if (comando.includes("(INTERFACE)")) missing.push("interface");
  if (comando.includes("(VRF)")) missing.push("vrf");
  if (comando.includes("(IP)")) missing.push("ip");
  if (comando.includes("(WORD)")) missing.push("word");

  const display = comando.slice(GRB_COMMAND_VALUE_PREFIX_LENGTH);

  return {
    display,
    resolvedValue: comando,
    ready: comando.length > 0 && missing.length === 0,
    missing,
  };
}

/** Indica se a string parece um IPv4 válido. */
export function isGrbCircuitIpValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})$/;
  return ipv4.test(trimmed);
}

/** Retorna preset de comando pelo id ou o padrão ping (IP). */
export function getGrbCommandPreset(id: string): GrbCommandPreset {
  return (
    GRB_COMMAND_PRESETS.find((preset) => preset.id === id) ??
    GRB_COMMAND_PRESETS.find((preset) => preset.id === GRB_DEFAULT_COMMAND_PRESET_ID) ??
    GRB_COMMAND_PRESETS[0]
  );
}

/** Valida campos mínimos conforme o preset selecionado. */
export function validateGrbTestInput(
  preset: GrbCommandPreset,
  ipNetwork: string,
  networkInterface: string,
  vrfName: string,
  word: string,
): string[] {
  const errors: string[] = [];
  const preview = buildGrbCommandPreview({
    preset,
    ipNetwork,
    networkInterface,
    vrfName,
    word,
  });

  if (preset.requiresIp && !isGrbCircuitIpValid(ipNetwork)) {
    errors.push("Informe um IPv4 válido em IP/Network.");
  }

  if (preset.requiresInterface && !networkInterface.trim()) {
    errors.push("Informe interface ou designação.");
  }

  if (preset.requiresVrf && !vrfName.trim()) {
    errors.push("Informe a VRF.");
  }

  if (preset.requiresWord && !word.trim()) {
    errors.push("Informe o campo WORD.");
  }

  if (!preview.ready && errors.length === 0) {
    errors.push("Preencha os campos exigidos pelo comando selecionado.");
  }

  return errors;
}
