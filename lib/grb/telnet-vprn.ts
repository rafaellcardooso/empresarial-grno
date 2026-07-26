/** Comando GRB para listar serviços VPRN em eqptos Nokia. */
export const SHOW_VPRN_COMMAND = "ISynu}show service service-using vprn";

export type VprnEntry = {
  serviceId: string;
  name: string;
};

const VPRN_ROW_RE = /^\s*(\d+)\s+VPRN\s+\S+\s+\S+\s+\d+\s+(\S+)\s*$/gm;

/** Extrai pares service-id/nome da saída de show service service-using vprn. */
export function parseVprnEntries(output: string): VprnEntry[] {
  const seen = new Set<string>();
  const entries: VprnEntry[] = [];

  for (const match of output.matchAll(VPRN_ROW_RE)) {
    const serviceId = match[1]?.trim() ?? "";
    const name = match[2]?.trim() ?? "";
    if (!serviceId || !name || seen.has(name)) continue;
    seen.add(name);
    entries.push({ serviceId, name });
  }

  return entries;
}

/** Resolve router-instance Nokia (nome do serviço) para ping router-instance. */
export function resolveRouterInstance(name: string, entries?: VprnEntry[]): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  if (entries) {
    const match = entries.find((entry) => entry.name === trimmed);
    if (match) return match.name;
  }

  return trimmed;
}

/** Resolve service-id Nokia para show router {id} bgp … (posição após show router). */
export function resolveVprnServiceId(value: string, entries?: VprnEntry[]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d+$/.test(trimmed)) return trimmed;

  if (entries) {
    const byName = entries.find((entry) => entry.name === trimmed);
    if (byName?.serviceId) return byName.serviceId;
  }

  const colonSuffix = trimmed.match(/:(\d+)$/);
  if (colonSuffix?.[1]) return colonSuffix[1];

  return "";
}
