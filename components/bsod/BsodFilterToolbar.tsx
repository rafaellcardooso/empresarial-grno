"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import {
  BSOD_TRATATIVA_FILTER_OPTIONS,
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
  tratativaCounts: Record<"all" | BsodTratativaFilter, number>;
  activeState: BsodUrlState;
};

const HEALTH_FILTERS: Array<{ key: "all" | BsodHealthFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "sem_leitura", label: "Sem leitura" },
];

const VLAN_FILTERS: Array<{ key: "all" | BsodVlanFilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "com_vlan", label: "Com VLAN" },
  { key: "sem_vlan", label: "Sem VLAN" },
];

/** Barra de filtros BSOD: saúde, VLAN, tratativa, CMTS e node. */
export function BsodFilterToolbar({
  healthCounts,
  vlanCounts,
  cmtsOptions,
  nodeOptions,
  tratativaCounts,
  activeState,
}: BsodFilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(next: BsodUrlState) {
    router.push(buildBsodHref(next), { scroll: false });
  }

  function mergeState(partial: Partial<BsodUrlState>): BsodUrlState {
    const current = bsodUrlStateFromParams({
      filtro: searchParams.get("filtro") ?? undefined,
      saude: searchParams.get("saude") ?? undefined,
      cmts: searchParams.get("cmts") ?? undefined,
      node: searchParams.get("node") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      tratativa: searchParams.get("tratativa") ?? undefined,
    });
    return { ...current, ...partial };
  }

  function healthCount(key: "all" | BsodHealthFilter): number {
    if (key === "all") return healthCounts.total;
    if (key === "online") return healthCounts.online;
    if (key === "offline") return healthCounts.offline;
    return healthCounts.sem_leitura;
  }

  function vlanCount(key: "all" | BsodVlanFilterKey): number {
    if (key === "all") return vlanCounts.total;
    if (key === "com_vlan") return vlanCounts.com_vlan;
    return vlanCounts.sem_vlan;
  }

  function healthHref(key: "all" | BsodHealthFilter): string {
    return buildBsodHref({
      ...activeState,
      saude: key === "all" ? undefined : key,
      page: undefined,
    });
  }

  function vlanHref(key: "all" | BsodVlanFilterKey): string {
    return buildBsodHref({
      ...activeState,
      filtro: key === "all" ? undefined : key,
      page: undefined,
    });
  }

  function tratativaHref(key: "all" | BsodTratativaFilter): string {
    return buildBsodHref({
      ...activeState,
      tratativa: key === "all" ? undefined : key,
      page: undefined,
    });
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

  const activeVlan =
    activeState.filtro === "com_vlan" || activeState.filtro === "sem_vlan"
      ? activeState.filtro
      : undefined;

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

        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">VLAN</span>
          <div className="sir-filter-toolbar__chips">
            {VLAN_FILTERS.map(({ key, label }) => {
              const active = key === "all" ? !activeVlan : activeVlan === key;
              return (
                <SirFilterChip
                  key={key}
                  label={label}
                  count={vlanCount(key)}
                  href={vlanHref(key)}
                  active={active}
                />
              );
            })}
          </div>
        </div>

        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">Tratativa</span>
          <div className="sir-filter-toolbar__chips">
            {BSOD_TRATATIVA_FILTER_OPTIONS.map(({ key, label }) => {
              const active = key === "all" ? !activeState.tratativa : activeState.tratativa === key;
              return (
                <SirFilterChip
                  key={key}
                  label={label}
                  count={tratativaCounts[key]}
                  href={tratativaHref(key)}
                  active={active}
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
            <div className="bsod-filter-field__control">
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
            <label className="form-label bsod-filter-field__label" htmlFor="bsod-filter-node">
              Node
            </label>
            <div className="bsod-filter-field__control">
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
  );
}
