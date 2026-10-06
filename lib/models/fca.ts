export type FcaRecordKind = "RAL" | "REC";

/** Chamado SIR (RAL ou REC/DSR/TCQ) com os dados usados no cabeçalho do FCA. */
export type FcaRecord = {
  kind: FcaRecordKind;
  numRecup: string;
  status: string;
  tipo: string | null;
  cliente: string | null;
  designacao: string | null;
  endereco: string | null;
  contato: string | null;
  cfExecutante: string | null;
  abertura: string | null;
};

export type FcaSearchResponse = {
  items: FcaRecord[];
  hasMore: boolean;
};

/** Campos editáveis do cabeçalho do FCA (preenchidos pela busca ou manualmente). */
export type FcaHeaderFields = {
  chamado: string;
  cliente: string;
  designacao: string;
  endereco: string;
  contato: string;
  cfExecutante: string;
  abertura: string;
  /** Valor de `datetime-local` (`YYYY-MM-DDTHH:mm`). */
  normalizacao: string;
  /** Técnico que tratou o problema (cadastro `NOME (LOGIN)` ou texto livre). */
  tecnico: string;
};

/** Texto do FCA propriamente dito. */
export type FcaTextFields = {
  fato: string;
  causa: string;
  acao: string;
};
