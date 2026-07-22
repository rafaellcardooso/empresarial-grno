"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { buildSirFilterHref } from "@/lib/config/sir-filters";
import {
  RAL_TIPOS,
  type RalTipoKey,
  getRalTipoDefinition,
  ralTipoFilterLabel,
} from "@/lib/config/ral-types";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { RAL_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { formatNumberPtBr } from "@/lib/format/number";

type RalPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  byTipo: Record<string, number>;
  activeTipo?: RalTipoKey;
  activeCf?: string;
};

function ralFilterHref(filters: { tipo?: RalTipoKey; cf?: string } = {}): string {
  return buildSirFilterHref("/sir/rals", filters);
}

function buildRalTitle(rowsCount: number, tipoLabel?: string, cf?: string): string {
  const parts = ["RAL"];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  return `${parts.join(" — ")} (${rowsCount})`;
}

/** Painel RAL com filtros por tipo e tabela ordenável. */
export function RalPanel({ rows, total, byTipo, activeTipo, activeCf }: RalPanelProps) {
  const tipoLabel = ralTipoFilterLabel(activeTipo);

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4 col-lg-3 col-xl-2">
          <FilterMetricCard
            label={METRIC_LABELS.sir.totalRal}
            value={formatNumberPtBr(total)}
            href={ralFilterHref({ cf: activeCf })}
            active={!activeTipo}
            variant="neutral"
          />
        </div>
        {RAL_TIPOS.map((tipo) => {
          const count = byTipo[tipo.value] ?? 0;
          return (
            <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={tipo.key}>
              <FilterMetricCard
                label={tipo.label}
                value={formatNumberPtBr(count)}
                href={ralFilterHref({ tipo: tipo.key, cf: activeCf })}
                active={activeTipo === tipo.key}
                className={tipo.filterClass}
              />
            </div>
          );
        })}
        {Object.entries(byTipo)
          .filter(([value, count]) => count > 0 && !getRalTipoDefinition(value))
          .map(([value, count]) => (
            <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={value}>
              <FilterMetricCard
                label={value}
                value={formatNumberPtBr(count)}
                href={ralFilterHref({ cf: activeCf })}
                active={false}
                variant="default"
              />
            </div>
          ))}
      </div>

      <ContentCard title={buildRalTitle(rows.length, tipoLabel, activeCf)}>
        <SirRecordsTable
          columns={RAL_TABLE_COLUMNS}
          rows={rows}
          recordLabel="RAL"
          empty={
            tipoLabel || activeCf
              ? "Nenhuma RAL em aberto para os filtros selecionados."
              : "Nenhuma RAL em aberto."
          }
        />
      </ContentCard>
    </>
  );
}
