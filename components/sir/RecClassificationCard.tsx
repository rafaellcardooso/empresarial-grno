import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { REC_TIPOS, type RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";

type RecClassificationCardProps = {
  count: number;
  activeStatus: SirStatusFilter;
  activeTipo: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe o chip do tipo REC/DSR/TCQ ativo na listagem. */
export function RecClassificationCard({
  count,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RecClassificationCardProps) {
  const tipo = REC_TIPOS.find((item) => item.key === activeTipo);
  if (!tipo) return null;

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header fw-semibold">Classificação</div>
      <div className="card-body py-3">
        <div className="sir-filter-toolbar__chips">
          <SirFilterChip
            label={tipo.chipLabel}
            count={count}
            href={buildRecFilterHref("/sir/recs", {
              status: activeStatus,
              tipo: tipo.key,
              cf: activeCf,
              ddd: activeDdd,
              tratativa: activeTreatment,
              q: activeQ,
            })}
            active
            accentClass={tipo.filterClass}
          />
        </div>
      </div>
    </div>
  );
}
