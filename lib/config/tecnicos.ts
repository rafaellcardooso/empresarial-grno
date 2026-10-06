/** Catálogo fixo de skills de técnicos (código gravado em `app_tecnico_skills.skill`). */
export const TECNICO_SKILLS = [
  { code: "FO", label: "Fibra óptica", shortLabel: "Fibra", icon: "bi-lightning-charge" },
  { code: "GPON", label: "GPON", shortLabel: "GPON", icon: "bi-diagram-3" },
  { code: "HFC", label: "HFC / Coaxial", shortLabel: "HFC", icon: "bi-tv" },
  { code: "METALICO", label: "Cabo metálico", shortLabel: "Metálico", icon: "bi-ethernet" },
  { code: "RADIO", label: "Rádio / MW", shortLabel: "Rádio", icon: "bi-broadcast-pin" },
  { code: "SDH", label: "SDH / Transmissão", shortLabel: "SDH", icon: "bi-hdd-network" },
  { code: "DADOS", label: "Dados / IP", shortLabel: "Dados", icon: "bi-router" },
  { code: "VOZ", label: "Voz / PABX", shortLabel: "Voz", icon: "bi-telephone" },
  { code: "DATACENTER", label: "Datacenter", shortLabel: "Datacenter", icon: "bi-hdd-rack" },
] as const;

export type TecnicoSkill = (typeof TECNICO_SKILLS)[number]["code"];
export type TecnicoSkillEntry = (typeof TECNICO_SKILLS)[number];

/** Entrada do catálogo pelo código; código desconhecido retorna undefined. */
export function getTecnicoSkill(code: string): TecnicoSkillEntry | undefined {
  return TECNICO_SKILLS.find((skill) => skill.code === code);
}

const SKILL_CODES = new Set<string>(TECNICO_SKILLS.map((skill) => skill.code));

/** Valida código de skill (case-insensitive); inválido retorna undefined. */
export function parseTecnicoSkill(raw: string | null | undefined): TecnicoSkill | undefined {
  const code = raw?.trim().toUpperCase();
  return code && SKILL_CODES.has(code) ? (code as TecnicoSkill) : undefined;
}

/** Chave localStorage do último DDD escolhido nos seletores de técnico. */
export const TECNICO_LAST_DDD_STORAGE_KEY = "emp:acionamento-ddd";

/** Tamanho padrão de página da listagem de técnicos. */
export const TECNICO_LIST_PAGE_SIZE = 50;

/** Limite máximo aceito pela API de técnicos. */
export const TECNICO_LIST_MAX_PAGE_SIZE = 200;

/** Máximo de linhas aceitas por importação CSV. */
export const TECNICO_IMPORT_MAX_ROWS = 2000;

/** Colunas do CSV de importação, na ordem do modelo. */
export const TECNICO_CSV_COLUMNS = [
  "nome",
  "login",
  "ddd",
  "cidade",
  "un",
  "telefone",
  "rg",
  "cpf",
  "skills",
  "ativo",
] as const;

/** Normaliza número de página (mínimo 1). */
export function tecnicoPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Normaliza limite com default 50 e teto 200. */
export function tecnicoLimitFromParam(param?: string | null): number {
  const limit = Number(param);
  if (!Number.isFinite(limit) || limit < 1) return TECNICO_LIST_PAGE_SIZE;
  return Math.min(Math.floor(limit), TECNICO_LIST_MAX_PAGE_SIZE);
}

/** Mascara documento mantendo os 3 últimos dígitos (`•••••123`). */
export function maskDocument(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `${"•".repeat(Math.max(digits.length - 3, 0))}${digits.slice(-3)}`;
}

/** Textos de UI do módulo de técnicos/acionamento. */
export const TECNICO_COPY = {
  pageDescription: "Técnicos de campo por DDD e skills, usados no acionamento.",
  listTitle: "Técnicos",
  searchPlaceholder: "Buscar por nome, login ou cidade…",
  allDdds: "Todos",
  allSkills: "Todas",
  ddd: "DDD",
  skill: "Skill",
  empty: "Nenhum técnico encontrado para os filtros.",
  newTecnico: "Novo técnico",
  importCsv: "Importar CSV",
  downloadTemplate: "Baixar modelo CSV",
  showInactive: "Mostrar inativos",
  hideInactive: "Ocultar inativos",
  inactive: "Inativo",
  edit: "Editar",
  drawerEyebrow: "Acionamento",
  drawerNew: "Novo técnico",
  drawerEdit: "Editar técnico",
  save: "Salvar",
  saving: "Salvando…",
  close: "Fechar",
  saved: "Técnico salvo.",
  importTitle: "Importar técnicos (CSV)",
  importHelp:
    "Arquivo CSV (separador ; ou ,) com cabeçalho. Técnicos são atualizados pelo login; logins novos são incluídos. Colunas opcionais ausentes do arquivo mantêm os dados já cadastrados. Skills separadas por | (ex.: FO|GPON). Ativo: S/N (vazio = S). Planilhas Excel: salvar como CSV.",
  importChoose: "Selecionar arquivo",
  importRun: "Importar",
  importBusy: "Importando…",
  importErrors: "Nenhuma linha foi gravada. Corrija os erros e importe novamente:",
  importDone: "Importação concluída: {inserted} incluído(s), {updated} atualizado(s).",
  pickerLabel: "Selecionar técnico cadastrado",
  pickerPlaceholder: "Escolha um técnico…",
  pickerEmpty: "Nenhum técnico ativo neste DDD.",
  pickerHasMore: `Lista parcial: exibindo os primeiros ${TECNICO_LIST_MAX_PAGE_SIZE} técnicos do DDD.`,
};
