"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import {
  buildBsodHref,
  bsodUrlStateFromParams,
  type BsodUrlState,
} from "@/lib/config/bsod-filters";
import type { BsodFacetCount, BsodHealthCounts, BsodHealthFilter } from "@/lib/queries/bsod";

type BsodFilterToolbarProps = {
  healthCounts: BsodHealthCounts;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  activeState: BsodUrlState;
};

const HEALTH_FILTERS: Array<{ key: "all" | BsodHealthFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "sem_leitura", label: "Sem leitura" },
];

/** Barra de filtros BSOD por saúde, CMTS e node. */
export function BsodFilterToolbar({
  healthCounts,
  cmtsOptions,
  nodeOptions,
  activeState,
}: BsodFilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(next: BsodUrlState) {
    router.push(buildBsodHref(next));
  }

  function mergeState(partial: Partial<BsodUrlState>): BsodUrlState {
    const current = bsodUrlStateFromParams({
      filtro: searchParams.get("filtro") ?? undefined,
      saude: searchParams.get("saude") ?? undefined,
      cmts: searchParams.get("cmts") ?? undefined,
      node: searchParams.get("node") ?? undefined,
    });
    return { ...current, ...partial };
  }

  function healthCount(key: "all" | BsodHealthFilter): number {
    if (key === "all") return healthCounts.total;
    if (key === "online") return healthCounts.online;
    if (key === "offline") return healthCounts.offline;
    return healthCounts.sem_leitura;
  }

  function healthHref(key: "all" | BsodHealthFilter): string {
    return buildBsodHref({
      ...activeState,
      saude: key === "all" ? undefined : key,
    });
  }

  function handleCmtsChange(value: string) {
    const next = mergeState({
      cmts: value || undefined,
      node: undefined,
    });
    navigate(next);
  }

  function handleNodeChange(value: string) {
    navigate(mergeState({ node: value || undefined }));
  }

  return (
    <div className="card shadow-sm mb-3 bsod-filter-toolbar">
      <div className="card-body py-3 d-flex flex-column gap-3">
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">Saúde</span>
          <div className="sir-filter-toolbar__chips">
            {HEALTH_FILTERS.map(({ key, label }) => {
              const active = key === "all" ? !activeState.saude : activeState.saude === key;
              return (
                <SirFilterChip
                  key={key}
                  label={label}
                  count={healthCount(key)}
                  href={healthHref(key)}
                  active={active}
                  accentClass={
                    key === "online"
                      ? "sir-filter-chip--bsod-online"
                      : key === "offline"
                        ? "sir-filter-chip--bsod-offline"
                        : key === "sem_leitura"
                          ? "sir-filter-chip--bsod-sem-leitura"
                          : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="bsod-filter-toolbar__selects">
          <div className="bsod-filter-field">
            <label className="form-label bsod-filter-field__label" htmlFor="bsod-filter-cmts">
              CMTS
            </label>
            <select
              id="bsod-filter-cmts"
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
          </div>

          <div className="bsod-filter-field">
            <label className="form-label bsod-filter-field__label" htmlFor="bsod-filter-node">
              Node
            </label>
            <select
              id="bsod-filter-node"
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
          </div>
        </div>
      </div>
    </div>
  );
}
