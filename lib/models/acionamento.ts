/** Campos do técnico preenchidos no acionamento WhatsApp. */
export type AcionamentoTechnicianInput = {
  whatsappTarget: string;
  janela: string;
  nome: string;
  cidade: string;
  un: string;
  login: string;
  rg: string;
  cpf: string;
  sintoma?: string;
};

/** Contexto BSOD para montar mensagem de acionamento WhatsApp. */
export type BsodAcionamentoContext = {
  recordKind: "BSOD";
  recordKey: string;
  contrato?: string;
  mac?: string;
  address?: string;
  cmts?: string;
  node?: string;
  profile?: string;
  monitorLabel?: string;
  sintoma?: string;
};

/** Contexto RAL/REC para montar mensagem de acionamento WhatsApp. */
export type SirAcionamentoContext = {
  recordKind: "RAL" | "REC";
  recordKey: string;
  numRecup: string;
  descricao?: string;
  designacao?: string;
  razaoSocial?: string;
  contratoNetsales?: string;
  endereco?: string;
  complemento?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  reclamante?: string;
  sintoma?: string;
};

export type AcionamentoContext = BsodAcionamentoContext | SirAcionamentoContext;
