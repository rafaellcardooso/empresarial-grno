import type { RalTipoKey } from "@/lib/config/ral-types";

export type SirCfFilterParams = {
  tipo?: RalTipoKey;
  cf?: string;
};

/** Decodifica CF da query string `cf`. */
export function cfFilterFromParam(param?: string): string | undefined {
  if (!param) return undefined;
  try {
    const decoded = decodeURIComponent(param).trim();
    return decoded || undefined;
  } catch {
    return undefined;
  }
}

/** Monta URL de listagem SIR preservando filtros ativos. */
export function buildSirFilterHref(basePath: string, filters: SirCfFilterParams = {}): string {
  const params = new URLSearchParams();
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.cf) params.set("cf", filters.cf);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Alterna filtro de CF: clique no ativo remove o filtro. */
export function cfFilterToggleHref(
  basePath: string,
  cf: string,
  activeCf?: string,
  extra?: Omit<SirCfFilterParams, "cf">,
): string {
  if (activeCf === cf) {
    return buildSirFilterHref(basePath, extra ?? {});
  }
  return buildSirFilterHref(basePath, { ...extra, cf });
}
