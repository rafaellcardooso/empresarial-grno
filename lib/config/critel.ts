export type CritelGraphType = {
  value: number;
  label: string;
};

export type CritelRangeOption = {
  value: string;
  label: string;
};

export type CritelGraphKind = "medias" | "picos";

export type CritelSearchMatch = {
  hierarquia: string;
  designacao: string;
  description: string;
};

export type CritelGraphSummaryEntry = {
  key: string;
  value: string;
};

export type CritelGraphData = {
  designacao: string;
  description: string;
  hierarquia: string;
  graphType: string;
  rangeLabel: string;
  graphKind: CritelGraphKind;
  datainicio: string;
  datafim: string;
  lastUpdate: string;
  summary: CritelGraphSummaryEntry[];
  imageBase64: string;
  imageContentType: string;
};

/** Tipos de gráfico expostos no formulário Critel (subset do portal legado). */
export const CRITEL_GRAPH_TYPES: CritelGraphType[] = [
  { value: 0, label: "Bits por segundo" },
  { value: 2, label: "Pacotes por segundo" },
  { value: 1, label: "Erros (5 minutos)" },
  { value: 3, label: "Descartes por segundo" },
  { value: 100, label: "Latência" },
  { value: 104, label: "Perda de Pacotes" },
  { value: 21, label: "IP SLA Latência" },
  { value: 22, label: "IP SLA Jitter" },
  { value: 23, label: "IP SLA Perda de Pacotes" },
];

export const CRITEL_DEFAULT_GRAPH_TYPE = 0;

/** Intervalos de abrangência espelhados do select range do Critel. */
export const CRITEL_RANGE_OPTIONS: CritelRangeOption[] = [
  { value: "0.25", label: "6 horas" },
  { value: "0.5", label: "12 horas" },
  { value: "1", label: "1 dia" },
  { value: "2", label: "2 dias" },
  { value: "3", label: "3 dias" },
  { value: "7", label: "7 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
];

export const CRITEL_DEFAULT_RANGE = "2";

export const CRITEL_DEFAULT_GRAPH_KIND: CritelGraphKind = "medias";

/** Padrão típico de designação (ex.: itz/ip/01816). */
export const CRITEL_DESIGNACAO_PATTERN = /^[a-z0-9]+\/[a-z0-9]+\/[a-z0-9]+$/i;

/** Normaliza designação informada (trim, remove espaços extras, maiúsculas). */
export function normalizeCritelDesignacao(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/\s*\/\s*/g, "/")
    .toUpperCase();
}

/** Indica se a designação tem formato mínimo LOC/TIPO/NUM. */
export function isCritelDesignacaoFormatValid(value: string): boolean {
  const normalized = normalizeCritelDesignacao(value);
  if (!normalized) return false;
  return CRITEL_DESIGNACAO_PATTERN.test(normalized);
}

/** Monta query Critel por designação exata (operador :=). */
export function buildCritelDesignacaoQuery(designacao: string): string {
  return `designacao := ${normalizeCritelDesignacao(designacao)}`;
}

/** Monta query Critel por designação parcial (operador :). */
export function buildCritelDesignacaoContainsQuery(designacao: string): string {
  return `designacao: ${normalizeCritelDesignacao(designacao)}`;
}

/** Retorna rótulo do tipo de gráfico pelo valor numérico do Critel. */
export function getCritelGraphTypeLabel(value: number): string {
  return CRITEL_GRAPH_TYPES.find((item) => item.value === value)?.label ?? `Gráfico ${value}`;
}

/** Retorna rótulo do intervalo pelo valor do select range. */
export function getCritelRangeLabel(value: string): string {
  return CRITEL_RANGE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}
