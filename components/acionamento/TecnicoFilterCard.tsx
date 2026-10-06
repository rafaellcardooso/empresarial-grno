import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { listOperationalDdds, operationalDddLabel } from "@/lib/config/locations";
import { TECNICO_COPY, TECNICO_SKILLS } from "@/lib/config/tecnicos";
import { buildTecnicosHref } from "@/lib/tecnicos/filters";

export type TecnicoUrlState = {
  ddd?: string;
  skill?: string;
  q?: string;
  inativos?: boolean;
};

type TecnicoFilterCardProps = {
  state: TecnicoUrlState;
  dddCounts: Record<string, number>;
  skillCounts: { bySkill: Record<string, number>; total: number };
};

/** Chips de DDD e de skill com contagem de técnicos (filtros na URL; página volta para 1). */
export function TecnicoFilterCard({ state, dddCounts, skillCounts }: TecnicoFilterCardProps) {
  const totalAllDdds = Object.values(dddCounts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body py-3 d-flex flex-column gap-3">
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">{TECNICO_COPY.ddd}</span>
          <div className="sir-filter-toolbar__chips">
            <SirFilterChip
              label={TECNICO_COPY.allDdds}
              count={totalAllDdds}
              href={buildTecnicosHref({ ...state, ddd: undefined })}
              active={!state.ddd}
            />
            {listOperationalDdds().map((ddd) => (
              <SirFilterChip
                key={ddd}
                label={operationalDddLabel(ddd)}
                count={dddCounts[ddd] ?? 0}
                href={buildTecnicosHref({ ...state, ddd })}
                active={state.ddd === ddd}
              />
            ))}
          </div>
        </div>
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">{TECNICO_COPY.skill}</span>
          <div className="sir-filter-toolbar__chips">
            <SirFilterChip
              label={TECNICO_COPY.allSkills}
              icon="bi-grid"
              count={skillCounts.total}
              href={buildTecnicosHref({ ...state, skill: undefined })}
              active={!state.skill}
            />
            {TECNICO_SKILLS.map((skill) => (
              <SirFilterChip
                key={skill.code}
                label={skill.shortLabel}
                icon={skill.icon}
                title={skill.label}
                count={skillCounts.bySkill[skill.code] ?? 0}
                href={buildTecnicosHref({ ...state, skill: skill.code })}
                active={state.skill === skill.code}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
