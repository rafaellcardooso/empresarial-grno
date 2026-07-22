"use client";

import { useSearchParams } from "next/navigation";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { formatNumberPtBr } from "@/lib/format/number";
import type { BsodFilterKey } from "@/lib/config/bsod-filters";
import { isBsodFilterKey } from "@/lib/config/bsod-filters";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import type { BsodSummary } from "@/lib/queries/bsod";

type BsodKpiBarProps = {
  summary: BsodSummary;
};

function filterHref(key?: BsodFilterKey): string {
  return key ? `/bsod?filtro=${key}` : "/bsod";
}

/** Barra de KPIs BSOD; destaque do filtro ativo vem da URL (sem re-render do layout). */
export function BsodKpiBar({ summary }: BsodKpiBarProps) {
  const searchParams = useSearchParams();
  const filtro = searchParams.get("filtro") ?? undefined;
  const activeFilter = isBsodFilterKey(filtro) ? filtro : undefined;

  return (
    <div className="row g-3 mb-3">
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.totalPme}
          value={formatNumberPtBr(summary.total)}
          href={filterHref()}
          active={!activeFilter}
          variant="neutral"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.online}
          value={formatNumberPtBr(summary.online)}
          href={filterHref("online")}
          active={activeFilter === "online"}
          variant="success"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.offline}
          value={formatNumberPtBr(summary.offline)}
          href={filterHref("offline")}
          active={activeFilter === "offline"}
          variant="danger"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.semLeitura}
          value={formatNumberPtBr(summary.sem_leitura)}
          href={filterHref("sem_leitura")}
          active={activeFilter === "sem_leitura"}
          variant="warning"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.comVlan}
          value={formatNumberPtBr(summary.com_vlan)}
          href={filterHref("com_vlan")}
          active={activeFilter === "com_vlan"}
          variant="default"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.semVlan}
          value={formatNumberPtBr(summary.sem_vlan)}
          href={filterHref("sem_vlan")}
          active={activeFilter === "sem_vlan"}
          variant="default"
        />
      </div>
    </div>
  );
}
