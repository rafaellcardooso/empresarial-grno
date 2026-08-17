import { RecClassificationCard } from "@/components/sir/RecClassificationCard";
import { RecLocationCard } from "@/components/sir/RecLocationCard";
import { SirTreatmentKpis } from "@/components/sir/SirTreatmentKpis";
import type { RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";
import type { CfCount, SirDddCount } from "@/lib/queries/sir";

type RecFilterPanelProps = {
  treatmentTotal: number;
  activeTreatmentCount: number;
  activeTreatment?: SirTreatmentFilter;
  totalAllDdds: number;
  tipoCount: number;
  cfItems: CfCount[];
  dddCounts: SirDddCount[];
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeQ?: string;
};

/** Organiza KPIs e cards de filtro da listagem REC/DSR/TCQ. */
export function RecFilterPanel(props: RecFilterPanelProps) {
  const treatmentBase = {
    tipo: props.activeTipo,
    cf: props.activeCf,
    ddd: props.activeDdd,
    q: props.activeQ,
  };
  const hasTipo = props.activeTipo != null;

  return (
    <>
      <SirTreatmentKpis
        total={props.treatmentTotal}
        activeTreatmentCount={props.activeTreatmentCount}
        activeFilter={props.activeTreatment}
        totalHref={buildRecFilterHref("/sir/recs", treatmentBase)}
        pendingHref={buildRecFilterHref("/sir/recs", {
          ...treatmentBase,
          tratativa: "pendente",
        })}
        activeHref={buildRecFilterHref("/sir/recs", {
          ...treatmentBase,
          tratativa: "em-tratativa",
        })}
      />
      <div className="row g-3 mb-3">
        <div className={hasTipo ? "col-12 col-xl-7" : "col-12"}>
          <RecLocationCard
            totalAllDdds={props.totalAllDdds}
            cfItems={props.cfItems}
            dddCounts={props.dddCounts}
            activeTipo={props.activeTipo}
            activeCf={props.activeCf}
            activeDdd={props.activeDdd}
            activeTreatment={props.activeTreatment}
            activeQ={props.activeQ}
          />
        </div>
        {props.activeTipo ? (
          <div className="col-12 col-xl-5">
            <RecClassificationCard
              count={props.tipoCount}
              activeStatus={props.activeStatus}
              activeTipo={props.activeTipo}
              activeCf={props.activeCf}
              activeDdd={props.activeDdd}
              activeTreatment={props.activeTreatment}
              activeQ={props.activeQ}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
