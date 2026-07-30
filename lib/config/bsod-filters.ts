import { BSOD_STATUS_LABELS, METRIC_LABELS } from "@/lib/config/metric-labels";
import { bsodOpesForDdd, listBsodDddOptions, parseBsodDddParam } from "@/lib/config/bsod-locations";
import { normalizeTableSearch } from "@/lib/config/table-search";
import {
  parseTratativaChamadoStatusFilter,
  TRATATIVA_CHAMADO_STATUS_LABELS,
  type TratativaChamadoStatus,
} from "@/lib/config/tratativa-chamados";
import type { BsodFilters, BsodHealthFilter, BsodListScope } from "@/lib/queries/bsod";

export type BsodFilterKey = "online" | "offline" | "sem_leitura" | "com_vlan" | "sem_vlan";

export type BsodVlanFilterKey = "com_vlan" | "sem_vlan";

/** Status ativos do pipeline (concluídos ficam no relatório). */
export type BsodTratativaFilter = Exclude<TratativaChamadoStatus, "concluido">;

/** Filtro de KPI operacional no monitor de alarmes. */
export type BsodAlarmStatusFilter = "pendente" | "em-tratativa";

export type BsodUrlState = {
  saude?: BsodHealthFilter;
  cmts?: string;
  node?: string;
  filtro?: BsodFilterKey;
  q?: string;
  tratativa?: BsodTratativaFilter;
  ddd?: string;
  status?: BsodAlarmStatusFilter;
  page?: number;
  normalizedPage?: number;
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

const DEFAULT_ALARM_DDD = listBsodDddOptions()[0]?.ddd;

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

/** Valida filtro de status operacional do monitor. */
export function isBsodAlarmStatusFilter(value?: string): value is BsodAlarmStatusFilter {
  return value === "pendente" || value === "em-tratativa";
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

type BsodSearchParamsInput = {
  filtro?: string;
  saude?: string;
  cmts?: string;
  node?: string;
  q?: string;
  page?: string;
  tratativa?: string;
  ddd?: string;
  status?: string;
  scope?: string;
  normalizedPage?: string;
};

/** Aplica escopo de operações a partir do DDD ativo. */
function applyDddToFilters(filters: BsodFilters, ddd: string | undefined): BsodFilters {
  if (!ddd) return filters;
  const opes = bsodOpesForDdd(ddd);
  if (opes.length === 0) return filters;
  return { ...filters, opes };
}

/** Converte parâmetros da URL em filtros de consulta BSOD. */
export function parseBsodSearchParams(
  params: BsodSearchParamsInput,
  options?: { scope?: BsodListScope; defaultDdd?: string },
): BsodFilters {
  const scope = options?.scope ?? (params.scope === "alarms" ? "alarms" : "inventory");
  const filtro = isBsodFilterKey(params.filtro) ? params.filtro : undefined;
  const saude = isBsodHealthFilter(params.saude)
    ? params.saude
    : filtro === "online" || filtro === "offline" || filtro === "sem_leitura"
      ? filtro
      : undefined;

  const ddd =
    parseBsodDddParam(params.ddd) ??
    (scope === "alarms" ? (options?.defaultDdd ?? DEFAULT_ALARM_DDD) : undefined);

  const filters: BsodFilters = {
    cmts: bsodParamFromUrl(params.cmts),
    node: bsodParamFromUrl(params.node),
    q: normalizeTableSearch(params.q),
    scope,
  };

  if (scope === "alarms") {
    filters.health = "offline";
  } else if (saude) {
    filters.health = saude;
  }

  if (filtro && VLAN_FILTERS.has(filtro as BsodVlanFilterKey)) {
    filters.vlan = filtro as BsodVlanFilterKey;
  }

  return applyDddToFilters(filters, ddd);
}

/** Extrai estado de URL BSOD a partir dos search params. */
export function bsodUrlStateFromParams(params: BsodSearchParamsInput): BsodUrlState {
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
    ddd: parseBsodDddParam(params.ddd),
    status: isBsodAlarmStatusFilter(params.status) ? params.status : undefined,
    page: params.page ? Number(params.page) : undefined,
    normalizedPage: params.normalizedPage ? Number(params.normalizedPage) : undefined,
  };
}

/** Monta query string comum a partir do estado BSOD. */
function bsodStateToSearchParams(
  state: BsodUrlState,
  options?: { includeStatus?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.saude) params.set("saude", state.saude);
  if (state.cmts) params.set("cmts", state.cmts);
  if (state.node) params.set("node", state.node);
  if (state.filtro && VLAN_FILTERS.has(state.filtro as BsodVlanFilterKey)) {
    params.set("filtro", state.filtro);
  }
  if (state.q) params.set("q", state.q);
  if (state.tratativa) params.set("tratativa", state.tratativa);
  if (state.ddd) params.set("ddd", state.ddd);
  if (options?.includeStatus !== false && state.status) params.set("status", state.status);
  if (state.page && state.page > 1) params.set("page", String(state.page));
  if (state.normalizedPage && state.normalizedPage > 1) {
    params.set("normalizedPage", String(state.normalizedPage));
  }

  return params;
}

/** Monta URL da página BSOD preservando filtros ativos. */
export function buildBsodHref(
  state: BsodUrlState = {},
  basePath: "/bsod" | "/bsod/inventario" = "/bsod",
): string {
  const params = bsodStateToSearchParams(state, {
    includeStatus: basePath === "/bsod",
  });
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
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
  if (state.ddd) {
    const option = listBsodDddOptions().find((item) => item.ddd === state.ddd);
    parts.push(option?.label ?? state.ddd);
  }
  if (state.status === "pendente") parts.push("Pendente");
  if (state.status === "em-tratativa") parts.push("Em tratativa");
  if (state.q) parts.push(`“${state.q}”`);
  return parts.length ? parts.join(" · ") : undefined;
}

/** Monta URL de exportação CSV BSOD preservando filtros ativos. */
export function buildBsodExportHref(
  state: BsodUrlState = {},
  options?: { scope?: BsodListScope },
): string {
  const params = bsodStateToSearchParams(state);
  const scope = options?.scope ?? "inventory";
  params.set("scope", scope);
  const query = params.toString();
  return query ? `/api/export/bsod?${query}` : `/api/export/bsod?scope=${scope}`;
}

/** DDD padrão do monitor de alarmes. */
export function defaultBsodAlarmDdd(): string | undefined {
  return DEFAULT_ALARM_DDD;
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
