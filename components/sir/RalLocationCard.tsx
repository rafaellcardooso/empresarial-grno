import { CfRankingList } from "@/components/sir/CfRankingList";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { operationalDddLabel } from "@/lib/config/locations";
import type { RalTipoKey } from "@/lib/config/ral-types";
import { buildSirFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RalLocationCardProps = {
  totalAllDdds: number;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe filtros RAL por DDD operacional e CF executante. */
export function RalLocationCard({
  totalAllDdds,
  cfItems,
  dddCounts,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RalLocationCardProps) {
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
              href={buildSirFilterHref("/sir/rals", {
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
                href={buildSirFilterHref("/sir/rals", {
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
          basePath="/sir/rals"
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
