"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { buildRecFilterHref } from "@/lib/config/sir-filters";
import { REC_TIPOS, type RecTipoKey, recTipoFilterLabel } from "@/lib/config/rec-types";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { formatNumberPtBr } from "@/lib/format/number";

type RecPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  byTipo: Record<string, number>;
  activeTipo?: RecTipoKey;
  activeCf?: string;
};

function recFilterHref(filters: { tipo?: RecTipoKey; cf?: string } = {}): string {
  return buildRecFilterHref("/sir/recs", filters);
}

function buildRecTitle(rowsCount: number, tipoLabel?: string, cf?: string): string {
  const parts: string[] = [METRIC_LABELS.sir.registros];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  return `${parts.join(" — ")} (${rowsCount})`;
}

/** Painel REC com filtros por tipo (REC/DSQ/TCQ) e tabela ordenável. */
export function RecPanel({ rows, total, byTipo, activeTipo, activeCf }: RecPanelProps) {
  const tipoLabel = recTipoFilterLabel(activeTipo);

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4 col-lg-3">
          <FilterMetricCard
            label={METRIC_LABELS.sir.recOpen}
            value={formatNumberPtBr(total)}
            href={recFilterHref({ cf: activeCf })}
            active={!activeTipo}
            variant="neutral"
          />
        </div>
        {REC_TIPOS.map((tipo) => (
          <div className="col-6 col-md-4 col-lg-3" key={tipo.key}>
            <FilterMetricCard
              label={tipo.label}
              value={formatNumberPtBr(byTipo[tipo.prefix] ?? 0)}
              href={recFilterHref({ tipo: tipo.key, cf: activeCf })}
              active={activeTipo === tipo.key}
              variant="default"
            />
          </div>
        ))}
      </div>

      <ContentCard title={buildRecTitle(rows.length, tipoLabel, activeCf)}>
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={rows}
          recordLabel="REC"
          empty={
            tipoLabel || activeCf
              ? "Nenhum registro em aberto para os filtros selecionados."
              : "Nenhum registro em aberto."
          }
        />
      </ContentCard>
    </>
  );
}
