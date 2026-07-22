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
import { sirStatusFilterLabel, type SirStatusFilter } from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { RAL_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { formatNumberPtBr } from "@/lib/format/number";

type RalPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  byTipo: Record<string, number>;
  openCount: number;
  closedCount: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
};

const RAL_STATUS_FILTERS: SirStatusFilter[] = ["ativo", "encerrado", "todos"];

function ralFilterHref(
  filters: {
    status?: SirStatusFilter;
    tipo?: RalTipoKey;
    cf?: string;
  } = {},
): string {
  return buildSirFilterHref("/sir/rals", filters);
}

function buildRalTitle(
  rowsCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
): string {
  const parts = ["RAL", statusLabel];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  return `${parts.join(" — ")} (${rowsCount})`;
}

function ralStatusCount(status: SirStatusFilter, openCount: number, closedCount: number): number {
  if (status === "ativo") return openCount;
  if (status === "encerrado") return closedCount;
  return openCount + closedCount;
}

function ralStatusLabel(status: SirStatusFilter): string {
  if (status === "ativo") return METRIC_LABELS.sir.ralOpen;
  if (status === "encerrado") return METRIC_LABELS.sir.closedRal;
  return METRIC_LABELS.sir.allRecords;
}

function ralEmptyMessage(status: SirStatusFilter, tipoLabel?: string, cf?: string): string {
  const scope =
    status === "encerrado" ? "RAL encerrada" : status === "todos" ? "RAL" : "RAL em aberto";
  if (tipoLabel || cf) {
    return `Nenhuma ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhuma RAL encerrada." : `Nenhuma ${scope}.`;
}

/** Painel RAL com filtros por status, tipo e tabela ordenável. */
export function RalPanel({
  rows,
  total,
  byTipo,
  openCount,
  closedCount,
  activeStatus,
  activeTipo,
  activeCf,
}: RalPanelProps) {
  const tipoLabel = ralTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusFilterLabel(activeStatus);

  return (
    <>
      <div className="row g-3 mb-3">
        {RAL_STATUS_FILTERS.map((status) => (
          <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={status}>
            <FilterMetricCard
              label={ralStatusLabel(status)}
              value={formatNumberPtBr(ralStatusCount(status, openCount, closedCount))}
              href={ralFilterHref({ status, tipo: activeTipo, cf: activeCf })}
              active={activeStatus === status}
              variant={status === "encerrado" ? "default" : "neutral"}
            />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4 col-lg-3 col-xl-2">
          <FilterMetricCard
            label={METRIC_LABELS.sir.totalRal}
            value={formatNumberPtBr(total)}
            href={ralFilterHref({ status: activeStatus, cf: activeCf })}
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
                href={ralFilterHref({ status: activeStatus, tipo: tipo.key, cf: activeCf })}
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
                href={ralFilterHref({ status: activeStatus, cf: activeCf })}
                active={false}
                variant="default"
              />
            </div>
          ))}
      </div>

      <ContentCard title={buildRalTitle(rows.length, statusLabel, tipoLabel, activeCf)}>
        <SirRecordsTable
          columns={RAL_TABLE_COLUMNS}
          rows={rows}
          recordLabel="RAL"
          empty={ralEmptyMessage(activeStatus, tipoLabel, activeCf)}
        />
      </ContentCard>
    </>
  );
}
