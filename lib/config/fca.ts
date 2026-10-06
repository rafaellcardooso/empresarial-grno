import type { FcaHeaderFields, FcaRecord, FcaTextFields } from "@/lib/models/fca";

/** Tamanho mínimo do termo de busca de chamado. */
export const FCA_SEARCH_MIN_LENGTH = 3;

/** Máximo de chamados exibidos no seletor de busca (termo mais específico refina o resultado). */
export const FCA_SEARCH_LIMIT = 20;

/** Campos do cabeçalho na ordem de exibição e do texto copiado. */
export const FCA_HEADER_FIELDS: Array<{
  key: keyof FcaHeaderFields;
  label: string;
  type: "text" | "datetime-local" | "tecnico";
}> = [
  { key: "chamado", label: "Chamado", type: "text" },
  { key: "cliente", label: "Cliente", type: "text" },
  { key: "designacao", label: "Designação", type: "text" },
  { key: "endereco", label: "Endereço", type: "text" },
  { key: "contato", label: "Contato", type: "text" },
  { key: "cfExecutante", label: "CF executante", type: "text" },
  { key: "abertura", label: "Abertura", type: "text" },
  { key: "normalizacao", label: "Normalização", type: "datetime-local" },
  { key: "tecnico", label: "Técnico", type: "tecnico" },
];

/** Rótulo da linha com o usuário que elaborou o FCA. */
export const FCA_RESPONSAVEL_LABEL = "Responsável";

/** Campos de texto do FCA na ordem de exibição e do texto copiado. */
export const FCA_TEXT_FIELDS: Array<{
  key: keyof FcaTextFields;
  label: string;
  placeholder: string;
}> = [
  { key: "fato", label: "Fato", placeholder: "O que aconteceu (sintoma, horário, impacto)." },
  { key: "causa", label: "Causa", placeholder: "Causa raiz identificada." },
  { key: "acao", label: "Ação", placeholder: "Ação executada para normalizar." },
];

export const EMPTY_FCA_HEADER: FcaHeaderFields = {
  chamado: "",
  cliente: "",
  designacao: "",
  endereco: "",
  contato: "",
  cfExecutante: "",
  abertura: "",
  normalizacao: "",
  tecnico: "",
};

export const EMPTY_FCA_TEXT: FcaTextFields = { fato: "", causa: "", acao: "" };

/** Textos de UI do módulo FCA. */
export const FCA_COPY = {
  description: "Monte o FCA (Fato, Causa e Ação) a partir de um chamado RAL ou REC.",
  searchTitle: "Buscar chamado",
  searchPlaceholder: "Número (RAL-123456/2026, REC-…, DSR-…, TCQ-…) ou designação",
  searchButton: "Buscar",
  searchBusy: "Buscando…",
  searchTooShort: `Informe ao menos ${FCA_SEARCH_MIN_LENGTH} caracteres.`,
  searchEmpty: "Nenhum chamado encontrado.",
  searchHasMore: `Exibindo os ${FCA_SEARCH_LIMIT} mais recentes. Refine a busca para ver outros.`,
  select: "Usar",
  selected: "Selecionado",
  headerTitle: "Dados do chamado",
  textTitle: "FCA",
  previewTitle: "Prévia",
  copy: "Copiar FCA",
  copied: "FCA copiado.",
  copyFailed: "Não foi possível copiar. Selecione o texto da prévia e copie manualmente.",
  copyHint: "Preencha Normalização, Fato, Causa e Ação para copiar.",
  normalizacaoBeforeAbertura: "Normalização anterior à abertura do chamado.",
  normalizacaoInFuture: "Normalização no futuro.",
  now: "Agora",
  tecnicoPlaceholder: "Nome do técnico ou selecione da lista",
  clear: "Limpar",
};

/** Converte chamado encontrado em campos do cabeçalho (vazio quando ausente). */
export function fcaHeaderFromRecord(record: FcaRecord): FcaHeaderFields {
  return {
    chamado: record.numRecup,
    cliente: record.cliente ?? "",
    designacao: record.designacao ?? "",
    endereco: record.endereco ?? "",
    contato: record.contato ?? "",
    cfExecutante: record.cfExecutante?.replace(/\s+/g, " ").trim() ?? "",
    abertura: record.abertura ?? "",
    normalizacao: "",
    tecnico: "",
  };
}
