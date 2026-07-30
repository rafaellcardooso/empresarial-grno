"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BsodClassificationCard } from "@/components/bsod/BsodClassificationCard";
import { BsodHealthKpis } from "@/components/bsod/BsodHealthKpis";
import { BsodLocationSearchCard } from "@/components/bsod/BsodLocationSearchCard";
import {
  buildBsodHref,
  bsodUrlStateFromParams,
  type BsodTratativaFilter,
  type BsodUrlState,
  type BsodVlanFilterKey,
} from "@/lib/config/bsod-filters";
import type {
  BsodFacetCount,
  BsodHealthCounts,
  BsodHealthFilter,
  BsodVlanCounts,
} from "@/lib/queries/bsod";

type BsodFilterToolbarProps = {
  healthCounts: BsodHealthCounts;
  vlanCounts: BsodVlanCounts;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  dddCounts: Array<{ ddd: string; label: string; total: number }>;
  tratativaCounts: Record<"all" | BsodTratativaFilter, number>;
  activeState: BsodUrlState;
};

/** Barra de filtros BSOD: saúde, VLAN, tratativa, CMTS e node. */
export function BsodFilterToolbar({
  healthCounts,
  vlanCounts,
  cmtsOptions,
  nodeOptions,
  dddCounts,
  tratativaCounts,
  activeState,
}: BsodFilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(next: BsodUrlState) {
    router.push(buildBsodHref(next, "/bsod/inventario"), { scroll: false });
  }

  function mergeState(partial: Partial<BsodUrlState>): BsodUrlState {
    const current = bsodUrlStateFromParams({
      filtro: searchParams.get("filtro") ?? undefined,
      saude: searchParams.get("saude") ?? undefined,
      cmts: searchParams.get("cmts") ?? undefined,
      node: searchParams.get("node") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      tratativa: searchParams.get("tratativa") ?? undefined,
      ddd: searchParams.get("ddd") ?? undefined,
    });
    return { ...current, ...partial };
  }

  function healthHref(key: "all" | BsodHealthFilter): string {
    return buildBsodHref(
      {
        ...activeState,
        saude: key === "all" ? undefined : key,
        page: undefined,
      },
      "/bsod/inventario",
    );
  }

  function vlanHref(key: "all" | BsodVlanFilterKey): string {
    return buildBsodHref(
      {
        ...activeState,
        filtro: key === "all" ? undefined : key,
        page: undefined,
      },
      "/bsod/inventario",
    );
  }

  function tratativaHref(key: "all" | BsodTratativaFilter): string {
    return buildBsodHref(
      {
        ...activeState,
        tratativa: key === "all" ? undefined : key,
        page: undefined,
      },
      "/bsod/inventario",
    );
  }

  function dddHref(ddd: string): string {
    return buildBsodHref(
      {
        ...activeState,
        ddd: activeState.ddd === ddd ? undefined : ddd,
        page: undefined,
      },
      "/bsod/inventario",
    );
  }

  function handleCmtsChange(value: string) {
    navigate(
      mergeState({
        cmts: value || undefined,
        node: undefined,
        page: undefined,
      }),
    );
  }

  function handleNodeChange(value: string) {
    navigate(mergeState({ node: value || undefined, page: undefined }));
  }

  return (
    <>
      <BsodHealthKpis
        counts={healthCounts}
        activeHealth={activeState.saude}
        buildHref={healthHref}
      />

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-5">
          <BsodLocationSearchCard
            activeDdd={activeState.ddd}
            activeCmts={activeState.cmts}
            activeNode={activeState.node}
            dddCounts={dddCounts}
            cmtsOptions={cmtsOptions}
            nodeOptions={nodeOptions}
            buildDddHref={dddHref}
            onCmtsChange={handleCmtsChange}
            onNodeChange={handleNodeChange}
          />
        </div>

        <div className="col-12 col-xl-7">
          <BsodClassificationCard
            activeState={activeState}
            vlanCounts={vlanCounts}
            tratativaCounts={tratativaCounts}
            buildVlanHref={vlanHref}
            buildTratativaHref={tratativaHref}
          />
        </div>
      </div>
    </>
  );
}
