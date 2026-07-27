import { BSOD_STATUS_LABELS, METRIC_LABELS } from "@/lib/config/metric-labels";
import { normalizeTableSearch } from "@/lib/config/table-search";
import {
  parseTratativaChamadoStatusFilter,
  TRATATIVA_CHAMADO_STATUS_LABELS,
  type TratativaChamadoStatus,
} from "@/lib/config/tratativa-chamados";
import type { BsodFilters, BsodHealthFilter } from "@/lib/queries/bsod";

export type BsodFilterKey = "online" | "offline" | "sem_leitura" | "com_vlan" | "sem_vlan";

export type BsodVlanFilterKey = "com_vlan" | "sem_vlan";

/** Status ativos do pipeline (concluídos ficam no relatório). */
export type BsodTratativaFilter = Exclude<TratativaChamadoStatus, "concluido">;

export type BsodUrlState = {
  saude?: BsodHealthFilter;
  cmts?: string;
  node?: string;
  filtro?: BsodFilterKey;
  q?: string;
  tratativa?: BsodTratativaFilter;
  page?: number;
};

const VALID_FILTERS = new Set<BsodFilterKey>([
  "online",
  "offline",
  "sem_leitura",
  "com_vlan",
  "sem_vlan",
]);

const VLAN_FILTERS = new Set<BsodVlanFilterKey>(["com_vlan", "sem_vlan"]);

const ACTIVE_TRATATIVA_FILTERS = new Set<BsodTratativaFilter>([
  "em_tratativa",
  "acionado",
  "validacao_pendente",
  "validacao_reprovada",
  "validado",
]);

/** Valida chave de filtro legado da URL (`filtro`). */
export function isBsodFilterKey(value?: string): value is BsodFilterKey {
  return value != null && VALID_FILTERS.has(value as BsodFilterKey);
}

/** Valida filtro de saúde na URL (`saude`). */
export function isBsodHealthFilter(value?: string): value is BsodHealthFilter {
  return value === "online" || value === "offline" || value === "sem_leitura";
}

/** Valida filtro de tratativa ativa na URL. */
export function isBsodTratativaFilter(value?: string): value is BsodTratativaFilter {
  if (!value) return false;
  const parsed = parseTratativaChamadoStatusFilter(value);
  return parsed !== "all" && parsed !== "concluido" && ACTIVE_TRATATIVA_FILTERS.has(parsed);
}

/** Decodifica parâmetro de texto da query string. */
export function bsodParamFromUrl(param?: string): string | undefined {
  if (!param) return undefined;
  try {
    const decoded = decodeURIComponent(param).trim();
    return decoded || undefined;
  } catch {
    return undefined;
  }
}

/** Converte parâmetros da URL em filtros de consulta BSOD. */
export function parseBsodSearchParams(params: {
  filtro?: string;
  saude?: string;
  cmts?: string;
  node?: string;
  q?: string;
  page?: string;
  tratativa?: string;
}): BsodFilters {
  const filtro = isBsodFilterKey(params.filtro) ? params.filtro : undefined;
  const saude = isBsodHealthFilter(params.saude)
    ? params.saude
    : filtro === "online" || filtro === "offline" || filtro === "sem_leitura"
      ? filtro
      : undefined;

  const filters: BsodFilters = {
    cmts: bsodParamFromUrl(params.cmts),
    node: bsodParamFromUrl(params.node),
    q: normalizeTableSearch(params.q),
  };

  if (saude) filters.health = saude;
  if (filtro && VLAN_FILTERS.has(filtro as BsodVlanFilterKey)) {
    filters.vlan = filtro as BsodVlanFilterKey;
  }

  return filters;
}

/** Extrai estado de URL BSOD a partir dos search params. */
export function bsodUrlStateFromParams(params: {
  filtro?: string;
  saude?: string;
  cmts?: string;
  node?: string;
  q?: string;
  page?: string;
  tratativa?: string;
}): BsodUrlState {
  const filtro = isBsodFilterKey(params.filtro) ? params.filtro : undefined;
  const saude = isBsodHealthFilter(params.saude)
    ? params.saude
    : filtro === "online" || filtro === "offline" || filtro === "sem_leitura"
      ? filtro
      : undefined;

  return {
    saude,
    cmts: bsodParamFromUrl(params.cmts),
    node: bsodParamFromUrl(params.node),
    filtro,
    q: normalizeTableSearch(params.q),
    tratativa: isBsodTratativaFilter(params.tratativa) ? params.tratativa : undefined,
    page: params.page ? Number(params.page) : undefined,
  };
}

/** Monta URL da página BSOD preservando filtros ativos. */
export function buildBsodHref(state: BsodUrlState = {}): string {
  const params = new URLSearchParams();

  if (state.saude) params.set("saude", state.saude);
  if (state.cmts) params.set("cmts", state.cmts);
  if (state.node) params.set("node", state.node);
  if (state.filtro && VLAN_FILTERS.has(state.filtro as BsodVlanFilterKey)) {
    params.set("filtro", state.filtro);
  }
  if (state.q) params.set("q", state.q);
  if (state.tratativa) params.set("tratativa", state.tratativa);
  if (state.page && state.page > 1) params.set("page", String(state.page));

  const query = params.toString();
  return query ? `/bsod?${query}` : "/bsod";
}

/** Converte query string `filtro` legado em filtros de consulta BSOD. */
export function parseBsodFilterParam(filtro?: string): BsodFilters {
  return parseBsodSearchParams({ filtro });
}

/** Resume filtros ativos da URL BSOD para título da tabela. */
export function bsodFilterSummary(state: BsodUrlState): string | undefined {
  const parts: string[] = [];
  if (state.saude === "online") parts.push(BSOD_STATUS_LABELS.online);
  if (state.saude === "offline") parts.push(BSOD_STATUS_LABELS.offline);
  if (state.saude === "sem_leitura") parts.push(BSOD_STATUS_LABELS.semLeitura);
  if (state.cmts) parts.push(state.cmts);
  if (state.node) parts.push(state.node);
  if (state.filtro === "com_vlan") parts.push(METRIC_LABELS.bsod.comVlan);
  if (state.filtro === "sem_vlan") parts.push(METRIC_LABELS.bsod.semVlan);
  if (state.tratativa) parts.push(TRATATIVA_CHAMADO_STATUS_LABELS[state.tratativa]);
  if (state.q) parts.push(`“${state.q}”`);
  return parts.length ? parts.join(" · ") : undefined;
}

/** Monta URL de exportação CSV BSOD preservando filtros ativos. */
export function buildBsodExportHref(state: BsodUrlState = {}): string {
  const params = new URLSearchParams();
  if (state.saude) params.set("saude", state.saude);
  if (state.cmts) params.set("cmts", state.cmts);
  if (state.node) params.set("node", state.node);
  if (state.filtro && VLAN_FILTERS.has(state.filtro as BsodVlanFilterKey)) {
    params.set("filtro", state.filtro);
  }
  if (state.q) params.set("q", state.q);
  if (state.tratativa) params.set("tratativa", state.tratativa);
  const query = params.toString();
  return query ? `/api/export/bsod?${query}` : "/api/export/bsod";
}

/** Chips de tratativa ativa na toolbar BSOD. */
export const BSOD_TRATATIVA_FILTER_OPTIONS: Array<{
  key: "all" | BsodTratativaFilter;
  label: string;
}> = [
  { key: "all", label: "Todos" },
  { key: "em_tratativa", label: TRATATIVA_CHAMADO_STATUS_LABELS.em_tratativa },
  { key: "acionado", label: TRATATIVA_CHAMADO_STATUS_LABELS.acionado },
  { key: "validacao_pendente", label: TRATATIVA_CHAMADO_STATUS_LABELS.validacao_pendente },
  { key: "validado", label: TRATATIVA_CHAMADO_STATUS_LABELS.validado },
  { key: "validacao_reprovada", label: TRATATIVA_CHAMADO_STATUS_LABELS.validacao_reprovada },
];
