export type RalTipoKey =
  "coletor" | "backbone" | "acesso_cliente" | "qualidade" | "ppc" | "fotonica" | "programada";

export type RalTipoDefinition = {
  key: RalTipoKey;
  value: string;
  label: string;
  badgeClass: string;
  filterClass: string;
};

/** Tipos oficiais de RAL observados no SIR (backup produção). */
export const RAL_TIPOS: RalTipoDefinition[] = [
  {
    key: "coletor",
    value: "COLETOR",
    label: "COLETOR",
    badgeClass: "ral-tipo-badge--coletor",
    filterClass: "filter-metric-card--ral-coletor",
  },
  {
    key: "backbone",
    value: "BACKBONE",
    label: "BACKBONE",
    badgeClass: "ral-tipo-badge--backbone",
    filterClass: "filter-metric-card--ral-backbone",
  },
  {
    key: "acesso_cliente",
    value: "ACESSO CLIENTE",
    label: "ACESSO CLIENTE",
    badgeClass: "ral-tipo-badge--acesso-cliente",
    filterClass: "filter-metric-card--ral-acesso-cliente",
  },
  {
    key: "qualidade",
    value: "QUALIDADE",
    label: "QUALIDADE",
    badgeClass: "ral-tipo-badge--qualidade",
    filterClass: "filter-metric-card--ral-qualidade",
  },
  {
    key: "ppc",
    value: "PPC",
    label: "PPC",
    badgeClass: "ral-tipo-badge--ppc",
    filterClass: "filter-metric-card--ral-ppc",
  },
  {
    key: "fotonica",
    value: "FOTÔNICA",
    label: "FOTÔNICA",
    badgeClass: "ral-tipo-badge--fotonica",
    filterClass: "filter-metric-card--ral-fotonica",
  },
  {
    key: "programada",
    value: "PROGRAMADA",
    label: "PROGRAMADA",
    badgeClass: "ral-tipo-badge--programada",
    filterClass: "filter-metric-card--ral-programada",
  },
];

const RAL_TIPO_BY_KEY = new Map(RAL_TIPOS.map((tipo) => [tipo.key, tipo]));
const RAL_TIPO_BY_VALUE = new Map(
  RAL_TIPOS.map((tipo) => [normalizeRalTipoValue(tipo.value), tipo]),
);

/** Normaliza valor de tipo para comparação (acentos e caixa). */
export function normalizeRalTipoValue(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").trim().toUpperCase();
}

/** Resolve metadados visuais do tipo de RAL. */
export function getRalTipoDefinition(value: string | null | undefined): RalTipoDefinition | null {
  if (!value) return null;
  return RAL_TIPO_BY_VALUE.get(normalizeRalTipoValue(value)) ?? null;
}

/** Valida chave de filtro `tipo` na URL. */
export function isRalTipoKey(value?: string): value is RalTipoKey {
  return value != null && RAL_TIPO_BY_KEY.has(value as RalTipoKey);
}

/** Converte query string `tipo` no valor persistido em `tipo_ral`. */
export function ralTipoValueFromParam(param?: string): string | undefined {
  if (!param || !isRalTipoKey(param)) return undefined;
  return RAL_TIPO_BY_KEY.get(param)?.value;
}

/** Rótulo legível do filtro ativo. */
export function ralTipoFilterLabel(param?: string): string | undefined {
  if (!param || !isRalTipoKey(param)) return undefined;
  return RAL_TIPO_BY_KEY.get(param)?.label;
}
