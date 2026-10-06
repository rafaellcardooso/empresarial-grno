import { operationalDddFromParam } from "@/lib/config/locations";
import { normalizeTableSearch } from "@/lib/config/table-search";
import { parseTecnicoSkill } from "@/lib/config/tecnicos";
import type { TecnicoFilters } from "@/lib/models/tecnico";

export type TecnicoSearchParams = {
  ddd?: string | null;
  skill?: string | null;
  q?: string | null;
  inativos?: string | null;
};

/**
 * Converte parâmetros da URL em filtros de técnicos.
 * Inativos só entram quando `inativos=1` e o usuário é STAFF; caso contrário, somente ativos.
 */
export function tecnicoFiltersFromParams(
  params: TecnicoSearchParams,
  isStaff: boolean,
): TecnicoFilters {
  const includeInactive = isStaff && params.inativos === "1";
  return {
    ddd: operationalDddFromParam(params.ddd),
    skill: parseTecnicoSkill(params.skill),
    q: normalizeTableSearch(params.q ?? undefined),
    ativo: includeInactive ? undefined : true,
  };
}

/** Monta URL da tela de acionamento preservando filtros (página omitida quando 1). */
export function buildTecnicosHref(state: {
  ddd?: string;
  skill?: string;
  q?: string;
  inativos?: boolean;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (state.ddd) params.set("ddd", state.ddd);
  if (state.skill) params.set("skill", state.skill);
  if (state.q) params.set("q", state.q);
  if (state.inativos) params.set("inativos", "1");
  if (state.page && state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  return query ? `/acionamento?${query}` : "/acionamento";
}
