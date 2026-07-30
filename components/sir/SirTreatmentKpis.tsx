import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import { formatNumberPtBr } from "@/lib/format/number";

type SirTreatmentKpisProps = {
  total: number;
  activeTreatmentCount: number;
  activeFilter?: SirTreatmentFilter;
  totalHref?: string;
  pendingHref?: string;
  activeHref?: string;
};

/** Exibe os totais operacionais de tratativa de um domínio SIR. */
export function SirTreatmentKpis({
  total,
  activeTreatmentCount,
  activeFilter,
  totalHref,
  pendingHref,
  activeHref,
}: SirTreatmentKpisProps) {
  const pendingCount = Math.max(total - activeTreatmentCount, 0);

  return (
    <div className="row g-2 mb-3">
      <div className="col-12 col-sm-4">
        <FilterMetricCard
          label="Total"
          value={formatNumberPtBr(total)}
          href={totalHref}
          active={!activeFilter && totalHref != null}
        />
      </div>
      <div className="col-12 col-sm-4">
        <FilterMetricCard
          label="Pendente"
          value={formatNumberPtBr(pendingCount)}
          href={pendingHref}
          active={activeFilter === "pendente"}
          variant="warning"
        />
      </div>
      <div className="col-12 col-sm-4">
        <FilterMetricCard
          label="Em tratativa"
          value={formatNumberPtBr(activeTreatmentCount)}
          href={activeHref}
          active={activeFilter === "em-tratativa"}
          variant="success"
        />
      </div>
    </div>
  );
}
