import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { REC_TIPOS, type RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";

type RecClassificationCardProps = {
  totalAllTipos: number;
  byTipo: Record<string, number>;
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe filtros pelos tipos REC, DSR e TCQ. */
export function RecClassificationCard({
  totalAllTipos,
  byTipo,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RecClassificationCardProps) {
  const common = {
    status: activeStatus,
    cf: activeCf,
    ddd: activeDdd,
    tratativa: activeTreatment,
    q: activeQ,
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header fw-semibold">Classificação REC</div>
      <div className="card-body py-3">
        <div className="sir-filter-toolbar__chips">
          <SirFilterChip
            label="Todos os tipos"
            count={totalAllTipos}
            href={buildRecFilterHref("/sir/recs", common)}
            active={!activeTipo}
          />
          {REC_TIPOS.filter(
            (tipo) => (byTipo[tipo.prefix] ?? 0) > 0 || activeTipo === tipo.key,
          ).map((tipo) => (
            <SirFilterChip
              key={tipo.key}
              label={tipo.chipLabel}
              count={byTipo[tipo.prefix] ?? 0}
              href={buildRecFilterHref("/sir/recs", { ...common, tipo: tipo.key })}
              active={activeTipo === tipo.key}
              accentClass={tipo.filterClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
