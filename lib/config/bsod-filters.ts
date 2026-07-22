import type { BsodFilters } from "@/lib/queries/bsod";

export type BsodFilterKey = "online" | "offline" | "sem_leitura" | "com_vlan" | "sem_vlan";

const VALID_FILTERS = new Set<BsodFilterKey>([
  "online",
  "offline",
  "sem_leitura",
  "com_vlan",
  "sem_vlan",
]);

/** Converte query string `filtro` em filtros de consulta BSOD. */
export function parseBsodFilterParam(filtro?: string): BsodFilters {
  if (!filtro || !VALID_FILTERS.has(filtro as BsodFilterKey)) {
    return { limit: 500 };
  }

  switch (filtro as BsodFilterKey) {
    case "online":
      return { health: "online", limit: 500 };
    case "offline":
      return { health: "offline", limit: 500 };
    case "sem_leitura":
      return { health: "sem_leitura", limit: 500 };
    case "com_vlan":
      return { vlan: "com_vlan", limit: 500 };
    case "sem_vlan":
      return { vlan: "sem_vlan", limit: 500 };
    default:
      return { limit: 500 };
  }
}

/** Valida chave de filtro da URL. */
export function isBsodFilterKey(value?: string): value is BsodFilterKey {
  return value != null && VALID_FILTERS.has(value as BsodFilterKey);
}
