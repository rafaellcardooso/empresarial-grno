import type { AcionamentoTechnicianInput } from "@/lib/models/acionamento";

export type AcionamentoFieldKey = keyof AcionamentoTechnicianInput;

export type AcionamentoFormField = {
  key: AcionamentoFieldKey;
  label: string;
  placeholder: string;
  hint?: string;
  col: 6 | 12;
  required?: boolean;
  digitsOnly?: boolean;
  maxLength?: number;
};

export const ACIONAMENTO_SCHEDULE_FIELDS: AcionamentoFormField[] = [
  {
    key: "janela",
    label: "Janela de atendimento",
    placeholder: "14:00 - 15:00",
    hint: "Horário previsto para visita técnica.",
    col: 12,
    required: true,
  },
];

export const ACIONAMENTO_TECHNICIAN_FIELDS: AcionamentoFormField[] = [
  {
    key: "nome",
    label: "Nome",
    placeholder: "Digite o nome do técnico",
    col: 6,
    required: true,
  },
  {
    key: "cidade",
    label: "Cidade",
    placeholder: "Digite a cidade",
    col: 6,
    required: true,
  },
  {
    key: "un",
    label: "UN",
    placeholder: "Digite a UN",
    digitsOnly: true,
    maxLength: 6,
    col: 6,
  },
  {
    key: "login",
    label: "Login",
    placeholder: "Digite o login",
    col: 6,
    required: true,
  },
  {
    key: "rg",
    label: "RG",
    placeholder: "Digite o RG",
    digitsOnly: true,
    maxLength: 14,
    col: 12,
    required: true,
  },
  {
    key: "cpf",
    label: "CPF",
    placeholder: "Digite o CPF",
    digitsOnly: true,
    maxLength: 11,
    col: 12,
  },
];

export const ACIONAMENTO_WHATSAPP_MENTION_FIELD: AcionamentoFormField = {
  key: "whatsappTarget",
  label: "Menção no grupo",
  placeholder: "Digite a menção no grupo",
  hint: "Opcional. Aparece no topo da mensagem.",
  col: 12,
};

export const ACIONAMENTO_SINTOMA_FIELD: AcionamentoFormField = {
  key: "sintoma",
  label: "Sintoma",
  placeholder: "Digite o sintoma",
  hint: "Preenchido automaticamente pelo status do PME; ajuste se necessário.",
  col: 12,
};

export const ACIONAMENTO_SINTOMA_FIELD_SIR: AcionamentoFormField = {
  key: "sintoma",
  label: "Sintoma",
  placeholder: "Digite o sintoma",
  hint: "Preenchido a partir dos detalhes SIR; ajuste se necessário.",
  col: 12,
};
