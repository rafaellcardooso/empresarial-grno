import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import {
  BSOD_TRATATIVA_FILTER_OPTIONS,
  type BsodTratativaFilter,
  type BsodUrlState,
  type BsodVlanFilterKey,
} from "@/lib/config/bsod-filters";
import type { BsodVlanCounts } from "@/lib/queries/bsod";

const VLAN_FILTERS: Array<{ key: "all" | BsodVlanFilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "com_vlan", label: "Com VLAN" },
  { key: "sem_vlan", label: "Sem VLAN" },
];

type BsodClassificationCardProps = {
  activeState: BsodUrlState;
  vlanCounts: BsodVlanCounts;
  tratativaCounts: Record<"all" | BsodTratativaFilter, number>;
  buildVlanHref: (key: "all" | BsodVlanFilterKey) => string;
  buildTratativaHref: (key: "all" | BsodTratativaFilter) => string;
};

/** Agrupa filtros de VLAN e estágio da tratativa BSOD. */
export function BsodClassificationCard({
  activeState,
  vlanCounts,
  tratativaCounts,
  buildVlanHref,
  buildTratativaHref,
}: BsodClassificationCardProps) {
  const activeVlan =
    activeState.filtro === "com_vlan" || activeState.filtro === "sem_vlan"
      ? activeState.filtro
      : undefined;

  return (
    <div className="card shadow-sm h-100 bsod-filter-toolbar bsod-classification-card">
      <div className="card-header fw-semibold">Classificação e tratativa</div>
      <div className="card-body py-3 d-flex flex-column gap-3">
        <section className="bsod-classification-card__section">
          <div className="bsod-classification-card__section-header">
            <span className="bsod-classification-card__title">VLAN</span>
            <span className="bsod-classification-card__description">
              Classificação do inventário pela presença de VLAN CMTS
            </span>
          </div>
          <div className="sir-filter-toolbar__chips bsod-classification-card__chips bsod-classification-card__chips--vlan">
            {VLAN_FILTERS.map(({ key, label }) => {
              const active = key === "all" ? !activeVlan : activeVlan === key;
              const count =
                key === "all"
                  ? vlanCounts.total
                  : key === "com_vlan"
                    ? vlanCounts.com_vlan
                    : vlanCounts.sem_vlan;
              return (
                <SirFilterChip
                  key={key}
                  label={label}
                  count={count}
                  href={buildVlanHref(key)}
                  active={active}
                />
              );
            })}
          </div>
        </section>

        <section className="bsod-classification-card__section">
          <div className="bsod-classification-card__section-header">
            <span className="bsod-classification-card__title">Tratativa</span>
            <span className="bsod-classification-card__description">
              Etapa operacional dos atendimentos ativos
            </span>
          </div>
          <div className="sir-filter-toolbar__chips bsod-classification-card__chips bsod-classification-card__chips--tratativa">
            {BSOD_TRATATIVA_FILTER_OPTIONS.map(({ key, label }) => {
              const active = key === "all" ? !activeState.tratativa : activeState.tratativa === key;
              return (
                <SirFilterChip
                  key={key}
                  label={label}
                  count={tratativaCounts[key]}
                  href={buildTratativaHref(key)}
                  active={active}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
