import type { TecnicoSkill } from "@/lib/config/tecnicos";

/** Técnico de campo com dados completos (uso no acionamento e na edição STAFF). */
export type Tecnico = {
  id: number;
  nome: string;
  login: string;
  ddd: string;
  cidade: string;
  un: string | null;
  telefone: string | null;
  rg: string | null;
  cpf: string | null;
  ativo: boolean;
  skills: TecnicoSkill[];
  updatedAt: string | null;
};

/** Técnico na listagem: RG e CPF mascarados. */
export type TecnicoListItem = Omit<Tecnico, "rg" | "cpf"> & {
  rgMasked: string | null;
  cpfMasked: string | null;
};

/** Dados de cadastro/edição validados (entrada do formulário ou de uma linha do CSV). */
export type TecnicoInput = {
  nome: string;
  login: string;
  ddd: string;
  cidade: string;
  un: string | null;
  telefone: string | null;
  rg: string | null;
  cpf: string | null;
  ativo: boolean;
  skills: TecnicoSkill[];
};

export type TecnicoFilters = {
  ddd?: string;
  skill?: TecnicoSkill;
  q?: string;
  /** `true` = só ativos (padrão); `false` = só inativos; `undefined` com `includeInactive` = todos. */
  ativo?: boolean;
};

export type TecnicoListResponse = {
  items: TecnicoListItem[];
  total: number;
  page: number;
  limit: number;
};

export type TecnicoImportError = { line: number; message: string };

export type TecnicoImportResult = {
  inserted: number;
  updated: number;
};
