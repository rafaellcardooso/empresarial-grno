import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { RAL_TIPOS, getRalTipoDefinition, type RalTipoKey } from "@/lib/config/ral-types";
import { buildSirFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirStatusFilter } from "@/lib/config/sir-status";

type RalClassificationCardProps = {
  totalAllTipos: number;
  byTipo: Record<string, number>;
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
};

/** Exibe filtros pelos tipos oficiais e adicionais encontrados nas RALs. */
export function RalClassificationCard({
  totalAllTipos,
  byTipo,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
}: RalClassificationCardProps) {
  const common = {
    status: activeStatus,
    cf: activeCf,
    ddd: activeDdd,
    tratativa: activeTreatment,
    q: activeQ,
  };
  const knownItems = RAL_TIPOS.filter(
    (tipo) => (byTipo[tipo.value] ?? 0) > 0 || activeTipo === tipo.key,
  ).map((tipo) => ({
    key: tipo.key,
    label: tipo.chipLabel,
    count: byTipo[tipo.value] ?? 0,
    href: buildSirFilterHref("/sir/rals", { ...common, tipo: tipo.key }),
    active: activeTipo === tipo.key,
    accentClass: tipo.filterClass,
  }));
  const extraItems = Object.entries(byTipo)
    .filter(([value, count]) => count > 0 && !getRalTipoDefinition(value))
    .map(([value, count]) => ({
      key: value,
      label: value,
      count,
      href: buildSirFilterHref("/sir/rals", common),
      active: false,
      accentClass: undefined,
    }));

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header fw-semibold">Classificação RAL</div>
      <div className="card-body py-3">
        <div className="sir-filter-toolbar__chips">
          <SirFilterChip
            label="Todos os tipos"
            count={totalAllTipos}
            href={buildSirFilterHref("/sir/rals", common)}
            active={!activeTipo}
          />
          {[...knownItems, ...extraItems].map((item) => (
            <SirFilterChip
              key={item.key}
              label={item.label}
              count={item.count}
              href={item.href}
              active={item.active}
              accentClass={item.accentClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
