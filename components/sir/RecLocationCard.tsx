import { CfRankingList } from "@/components/sir/CfRankingList";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { operationalDddLabel } from "@/lib/config/locations";
import type { RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RecLocationCardProps = {
  totalAllDdds: number;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe filtros REC por DDD operacional e CF executante (somente abertos). */
export function RecLocationCard({
  totalAllDdds,
  cfItems,
  dddCounts,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RecLocationCardProps) {
  const locationFilters = {
    status: "ativo" as const,
    tipo: activeTipo,
    tratativa: activeTreatment,
    q: activeQ,
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header fw-semibold">Localização e execução</div>
      <div className="card-body py-3">
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">DDD</span>
          <div className="sir-filter-toolbar__chips">
            <SirFilterChip
              label="Todos"
              count={totalAllDdds}
              href={buildRecFilterHref("/sir/recs", {
                ...locationFilters,
                cf: activeCf,
              })}
              active={!activeDdd}
            />
            {dddCounts.map((item) => (
              <SirFilterChip
                key={item.ddd}
                label={operationalDddLabel(item.ddd)}
                count={item.total}
                href={buildRecFilterHref("/sir/recs", {
                  ...locationFilters,
                  cf: activeCf,
                  ddd: item.ddd,
                })}
                active={activeDdd === item.ddd}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="card-header border-top fw-semibold">Por CF executante</div>
      <ul className="list-group list-group-flush cf-ranking-list">
        <CfRankingList
          items={cfItems}
          basePath="/sir/recs"
          activeCf={activeCf}
          filterParams={{
            ...locationFilters,
            ddd: activeDdd,
          }}
        />
      </ul>
    </div>
  );
}
