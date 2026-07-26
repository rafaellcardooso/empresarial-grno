"use client";

import { useSearchParams } from "next/navigation";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { buildBsodHref, bsodUrlStateFromParams } from "@/lib/config/bsod-filters";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { formatNumberPtBr } from "@/lib/format/number";
import type { BsodSummary } from "@/lib/queries/bsod";

type BsodKpiBarProps = {
  summary: BsodSummary;
};

type BsodVlanFilterKey = "com_vlan" | "sem_vlan";

/** Barra de KPIs BSOD; links preservam filtros de saúde, CMTS e node. */
export function BsodKpiBar({ summary }: BsodKpiBarProps) {
  const searchParams = useSearchParams();
  const state = bsodUrlStateFromParams({
    filtro: searchParams.get("filtro") ?? undefined,
    saude: searchParams.get("saude") ?? undefined,
    cmts: searchParams.get("cmts") ?? undefined,
    node: searchParams.get("node") ?? undefined,
  });

  const vlanFilter =
    state.filtro === "com_vlan" || state.filtro === "sem_vlan" ? state.filtro : undefined;

  function href(patch: {
    saude?: typeof state.saude | null;
    filtro?: BsodVlanFilterKey | null;
  }): string {
    return buildBsodHref({
      saude: patch.saude === null ? undefined : (patch.saude ?? state.saude),
      cmts: state.cmts,
      node: state.node,
      filtro:
        patch.filtro === null
          ? undefined
          : (patch.filtro ?? (vlanFilter ? state.filtro : undefined)),
    });
  }

  return (
    <div className="row g-3 mb-3">
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.totalPme}
          value={formatNumberPtBr(summary.total)}
          href={href({ saude: null, filtro: null })}
          active={!state.saude && !vlanFilter}
          variant="neutral"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.online}
          value={formatNumberPtBr(summary.online)}
          href={href({ saude: "online", filtro: null })}
          active={state.saude === "online"}
          variant="success"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.offline}
          value={formatNumberPtBr(summary.offline)}
          href={href({ saude: "offline", filtro: null })}
          active={state.saude === "offline"}
          variant="danger"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.semLeitura}
          value={formatNumberPtBr(summary.sem_leitura)}
          href={href({ saude: "sem_leitura", filtro: null })}
          active={state.saude === "sem_leitura"}
          variant="warning"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.comVlan}
          value={formatNumberPtBr(summary.com_vlan)}
          href={href({ filtro: "com_vlan" })}
          active={state.filtro === "com_vlan"}
          variant="default"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-2">
        <FilterMetricCard
          label={METRIC_LABELS.bsod.semVlan}
          value={formatNumberPtBr(summary.sem_vlan)}
          href={href({ filtro: "sem_vlan" })}
          active={state.filtro === "sem_vlan"}
          variant="default"
        />
      </div>
    </div>
  );
}
