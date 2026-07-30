import { RecClassificationCard } from "@/components/sir/RecClassificationCard";
import { RecLocationCard } from "@/components/sir/RecLocationCard";
import { SirTreatmentKpis } from "@/components/sir/SirTreatmentKpis";
import type { RecTipoKey } from "@/lib/config/rec-types";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RecFilterPanelProps = {
  treatmentTotal: number;
  activeTreatmentCount: number;
  activeTreatment?: SirTreatmentFilter;
  totalAllTipos: number;
  totalAllDdds: number;
  byTipo: Record<string, number>;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeQ?: string;
};

/** Organiza KPIs e cards de filtro da listagem REC. */
export function RecFilterPanel(props: RecFilterPanelProps) {
  return (
    <>
      <SirTreatmentKpis
        total={props.treatmentTotal}
        activeTreatmentCount={props.activeTreatmentCount}
        activeFilter={props.activeTreatment}
        totalHref="/sir/recs"
        pendingHref="/sir/recs?tratativa=pendente"
        activeHref="/sir/recs?tratativa=em-tratativa"
      />
      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <RecLocationCard {...props} />
        </div>
        <div className="col-12 col-xl-5">
          <RecClassificationCard {...props} />
        </div>
      </div>
    </>
  );
}
