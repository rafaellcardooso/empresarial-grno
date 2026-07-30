import { RalClassificationCard } from "@/components/sir/RalClassificationCard";
import { RalLocationCard } from "@/components/sir/RalLocationCard";
import { SirTreatmentKpis } from "@/components/sir/SirTreatmentKpis";
import type { RalTipoKey } from "@/lib/config/ral-types";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RalFilterPanelProps = {
  treatmentTotal: number;
  activeTreatmentCount: number;
  activeTreatment?: SirTreatmentFilter;
  totalAllTipos: number;
  totalAllDdds: number;
  byTipo: Record<string, number>;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeQ?: string;
};

/** Organiza KPIs e cards de filtro da listagem RAL. */
export function RalFilterPanel(props: RalFilterPanelProps) {
  return (
    <>
      <SirTreatmentKpis
        total={props.treatmentTotal}
        activeTreatmentCount={props.activeTreatmentCount}
        activeFilter={props.activeTreatment}
        totalHref="/sir/rals"
        pendingHref="/sir/rals?tratativa=pendente"
        activeHref="/sir/rals?tratativa=em-tratativa"
      />
      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <RalLocationCard {...props} />
        </div>
        <div className="col-12 col-xl-5">
          <RalClassificationCard {...props} />
        </div>
      </div>
    </>
  );
}
