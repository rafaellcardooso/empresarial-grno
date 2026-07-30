"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import {
  buildBsodHref,
  bsodUrlStateFromParams,
  type BsodAlarmStatusFilter,
  type BsodUrlState,
} from "@/lib/config/bsod-filters";
import { listBsodDddOptions } from "@/lib/config/bsod-locations";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import type { BsodFacetCount } from "@/lib/queries/bsod";

export type BsodAlarmKpiCounts = {
  total: number;
  pending: number;
  inProgress: number;
};

type BsodAlarmToolbarProps = {
  kpiCounts: BsodAlarmKpiCounts;
  dddCounts: Array<{ ddd: string; label: string; total: number }>;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  activeState: BsodUrlState;
};

/** KPIs e filtros do monitor de alarmes BSOD. */
export function BsodAlarmToolbar({
  kpiCounts,
  dddCounts,
  cmtsOptions,
  nodeOptions,
  activeState,
}: BsodAlarmToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dddOptions = listBsodDddOptions();

  function navigate(next: BsodUrlState) {
    router.push(buildBsodHref(next, "/bsod"), { scroll: false });
  }

  function mergeState(partial: Partial<BsodUrlState>): BsodUrlState {
    const current = bsodUrlStateFromParams({
      cmts: searchParams.get("cmts") ?? undefined,
      node: searchParams.get("node") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      ddd: searchParams.get("ddd") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return { ...current, ...partial };
  }

  function statusHref(status?: BsodAlarmStatusFilter): string {
    return buildBsodHref({ ...activeState, status, page: undefined }, "/bsod");
  }

  function dddHref(ddd: string): string {
    return buildBsodHref({ ...activeState, ddd, page: undefined }, "/bsod");
  }

  function handleCmtsChange(value: string) {
    navigate(mergeState({ cmts: value || undefined, node: undefined, page: undefined }));
  }

  function handleNodeChange(value: string) {
    navigate(mergeState({ node: value || undefined, page: undefined }));
  }

  return (
    <>
      <div className="row g-2 mb-3">
        {[
          {
            key: "total",
            label: "Total offline",
            value: kpiCounts.total,
            status: undefined as BsodAlarmStatusFilter | undefined,
            variant: "default" as const,
          },
          {
            key: "pending",
            label: "Pendentes",
            value: kpiCounts.pending,
            status: "pendente" as const,
            variant: "warning" as const,
          },
          {
            key: "in-progress",
            label: "Em tratativa",
            value: kpiCounts.inProgress,
            status: "em-tratativa" as const,
            variant: "success" as const,
          },
        ].map((item) => (
          <div key={item.key} className="col-12 col-sm-4">
            <FilterMetricCard
              label={item.label}
              value={item.value}
              href={statusHref(item.status)}
              active={activeState.status === item.status}
              variant={item.variant}
            />
          </div>
        ))}
      </div>

      <div className="card shadow-sm mb-3 bsod-filter-toolbar">
        <div className="card-body py-3 d-flex flex-column gap-3">
          <div className="sir-filter-toolbar__group">
            <span className="sir-filter-toolbar__heading">DDD</span>
            <div className="sir-filter-toolbar__chips">
              {dddOptions.map((option) => {
                const count = dddCounts.find((item) => item.ddd === option.ddd)?.total ?? 0;
                return (
                  <SirFilterChip
                    key={option.ddd}
                    label={option.label}
                    count={count}
                    href={dddHref(option.ddd)}
                    active={activeState.ddd === option.ddd}
                  />
                );
              })}
            </div>
          </div>

          <div className="bsod-filter-toolbar__selects">
            <div className="bsod-filter-field">
              <label className="form-label bsod-filter-field__label" htmlFor="bsod-alarm-cmts">
                CMTS
              </label>
              <div className="bsod-filter-field__control">
                <select
                  id="bsod-alarm-cmts"
                  className="form-select form-select-sm"
                  value={activeState.cmts ?? ""}
                  onChange={(event) => handleCmtsChange(event.target.value)}
                >
                  <option value="">Todos os CMTS</option>
                  {cmtsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} ({option.total})
                    </option>
                  ))}
                </select>
                {activeState.cmts ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm bsod-filter-field__clear"
                    onClick={() => handleCmtsChange("")}
                    aria-label="Limpar CMTS"
                    title="Limpar CMTS"
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="bsod-filter-field">
              <label className="form-label bsod-filter-field__label" htmlFor="bsod-alarm-node">
                Node
              </label>
              <div className="bsod-filter-field__control">
                <select
                  id="bsod-alarm-node"
                  className="form-select form-select-sm"
                  value={activeState.node ?? ""}
                  onChange={(event) => handleNodeChange(event.target.value)}
                  disabled={nodeOptions.length === 0 && !activeState.node}
                >
                  <option value="">Todos os nodes</option>
                  {nodeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} ({option.total})
                    </option>
                  ))}
                </select>
                {activeState.node ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm bsod-filter-field__clear"
                    onClick={() => handleNodeChange("")}
                    aria-label="Limpar node"
                    title="Limpar node"
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
