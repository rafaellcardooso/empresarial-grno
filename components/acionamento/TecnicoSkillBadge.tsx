import { getTecnicoSkill } from "@/lib/config/tecnicos";

/** Badge compacta de skill: ícone e rótulo curto, com nome completo na dica. */
export function TecnicoSkillBadge({ code }: { code: string }) {
  const skill = getTecnicoSkill(code);
  return (
    <span className="badge tecnico-skill-badge" title={skill?.label ?? code}>
      {skill ? <i className={`bi ${skill.icon}`} aria-hidden="true" /> : null}
      {skill?.shortLabel ?? code}
    </span>
  );
}
