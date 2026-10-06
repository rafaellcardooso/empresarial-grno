import { getTecnicoSkill } from "@/lib/config/tecnicos";
import type { TecnicoListItem } from "@/lib/models/tecnico";

/** Skills em rótulo curto separadas por vírgula. */
export function formatTecnicoSkills(skills: readonly string[]): string {
  return skills.map((code) => getTecnicoSkill(code)?.shortLabel ?? code).join(", ");
}

/** Rótulo de opção de seletor: nome, cidade e skills. */
export function formatTecnicoOption(tecnico: TecnicoListItem): string {
  return [tecnico.nome, tecnico.cidade, formatTecnicoSkills(tecnico.skills)]
    .filter(Boolean)
    .join(" · ");
}

/** Identificação do técnico em texto livre (ex.: FCA): `NOME (LOGIN)`. */
export function formatTecnicoIdentity(tecnico: Pick<TecnicoListItem, "nome" | "login">): string {
  return `${tecnico.nome} (${tecnico.login})`;
}
