import { CfRankingList } from "@/components/sir/CfRankingList";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { operationalDddLabel } from "@/lib/config/locations";
import type { RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RecLocationCardProps = {
  totalAllDdds: number;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe filtros REC por DDD operacional e CF executante. */
export function RecLocationCard({
  totalAllDdds,
  cfItems,
  dddCounts,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RecLocationCardProps) {
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
                status: activeStatus,
                tipo: activeTipo,
                cf: activeCf,
                tratativa: activeTreatment,
                q: activeQ,
              })}
              active={!activeDdd}
            />
            {dddCounts.map((item) => (
              <SirFilterChip
                key={item.ddd}
                label={operationalDddLabel(item.ddd)}
                count={item.total}
                href={buildRecFilterHref("/sir/recs", {
                  status: activeStatus,
                  tipo: activeTipo,
                  cf: activeCf,
                  ddd: item.ddd,
                  tratativa: activeTreatment,
                  q: activeQ,
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
            tipo: activeTipo,
            status: activeStatus,
            ddd: activeDdd,
            tratativa: activeTreatment,
            q: activeQ,
          }}
        />
      </ul>
    </div>
  );
}
