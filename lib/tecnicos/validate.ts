import { operationalDddFromParam } from "@/lib/config/locations";
import { parseTecnicoSkill, type TecnicoSkill } from "@/lib/config/tecnicos";
import type { TecnicoInput } from "@/lib/models/tecnico";

export type TecnicoValidation = { ok: true; value: TecnicoInput } | { ok: false; error: string };

const LOGIN_PATTERN = /^[A-Z0-9._-]{2,64}$/;
const TRUE_VALUES = new Set(["", "S", "SIM", "1", "TRUE", "ATIVO", "Y", "YES"]);
const FALSE_VALUES = new Set(["N", "NAO", "NÃO", "0", "FALSE", "INATIVO", "NO"]);

/** Converte valor desconhecido em texto aparado com espaços colapsados. */
function text(value: unknown): string {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

/** Mantém só dígitos; vazio vira null. */
function digits(value: unknown): string | null {
  const only = text(value).replace(/\D/g, "");
  return only || null;
}

/** Interpreta ativo (boolean, S/N, 1/0, sim/não); vazio = ativo. */
function parseAtivo(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const normalized = text(value).toUpperCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

/** Interpreta skills como lista (array ou texto separado por `|`, `,` ou `;`). */
function parseSkills(value: unknown): { skills: TecnicoSkill[]; invalid: string[] } {
  const raw = Array.isArray(value) ? value.map(text) : text(value).split(/[|,;]/);
  const skills = new Set<TecnicoSkill>();
  const invalid: string[] = [];
  for (const item of raw.map((entry) => entry.trim()).filter(Boolean)) {
    const skill = parseTecnicoSkill(item);
    if (skill) skills.add(skill);
    else invalid.push(item);
  }
  return { skills: [...skills], invalid };
}

/** Valida campos de texto obrigatórios e opcionais com limites de tamanho. */
function validateTextFields(raw: Record<string, unknown>): string | null {
  const nome = text(raw.nome);
  if (!nome || nome.length > 120) return "Nome é obrigatório (até 120 caracteres).";
  const login = text(raw.login).toUpperCase();
  if (!LOGIN_PATTERN.test(login)) return "Login inválido (letras, números, . _ -; 2 a 64).";
  if (!operationalDddFromParam(text(raw.ddd))) return `DDD inválido: "${text(raw.ddd)}".`;
  const cidade = text(raw.cidade);
  if (!cidade || cidade.length > 120) return "Cidade é obrigatória (até 120 caracteres).";
  return null;
}

/** Valida documentos e contatos numéricos opcionais. */
function validateDigitFields(raw: Record<string, unknown>): string | null {
  const un = digits(raw.un);
  if (un && un.length > 6) return "UN deve ter até 6 dígitos.";
  const telefone = digits(raw.telefone);
  if (telefone && (telefone.length < 10 || telefone.length > 13)) {
    return "Telefone deve ter de 10 a 13 dígitos (com DDD).";
  }
  const rg = digits(raw.rg);
  if (rg && rg.length > 14) return "RG deve ter até 14 dígitos.";
  const cpf = digits(raw.cpf);
  if (cpf && cpf.length !== 11) return "CPF deve ter 11 dígitos.";
  return null;
}

/** Valida e normaliza dados de técnico vindos do formulário (JSON) ou de linha CSV. */
export function validateTecnicoInput(raw: Record<string, unknown> | null): TecnicoValidation {
  if (!raw) return { ok: false, error: "Dados inválidos." };
  const fieldError = validateTextFields(raw) ?? validateDigitFields(raw);
  if (fieldError) return { ok: false, error: fieldError };

  const ativo = parseAtivo(raw.ativo);
  if (ativo === null)
    return { ok: false, error: `Ativo inválido: "${text(raw.ativo)}" (use S ou N).` };

  const { skills, invalid } = parseSkills(raw.skills);
  if (invalid.length) return { ok: false, error: `Skill desconhecida: ${invalid.join(", ")}.` };

  return {
    ok: true,
    value: {
      nome: text(raw.nome),
      login: text(raw.login).toUpperCase(),
      ddd: text(raw.ddd),
      cidade: text(raw.cidade).toUpperCase(),
      un: digits(raw.un),
      telefone: digits(raw.telefone),
      rg: digits(raw.rg),
      cpf: digits(raw.cpf),
      ativo,
      skills,
    },
  };
}
