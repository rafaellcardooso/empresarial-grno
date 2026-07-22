"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { buildRecFilterHref } from "@/lib/config/sir-filters";
import { REC_TIPOS, type RecTipoKey, recTipoFilterLabel } from "@/lib/config/rec-types";
import { sirStatusFilterLabel, type SirStatusFilter } from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { formatNumberPtBr } from "@/lib/format/number";

type RecPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  byTipo: Record<string, number>;
  openCount: number;
  closedCount: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
};

const REC_STATUS_FILTERS: SirStatusFilter[] = ["ativo", "encerrado", "todos"];

function recFilterHref(
  filters: {
    status?: SirStatusFilter;
    tipo?: RecTipoKey;
    cf?: string;
  } = {},
): string {
  return buildRecFilterHref("/sir/recs", filters);
}

function buildRecTitle(
  rowsCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
): string {
  const parts = [METRIC_LABELS.sir.registros, statusLabel];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  return `${parts.join(" — ")} (${rowsCount})`;
}

function recStatusCount(status: SirStatusFilter, openCount: number, closedCount: number): number {
  if (status === "ativo") return openCount;
  if (status === "encerrado") return closedCount;
  return openCount + closedCount;
}

function recStatusLabel(status: SirStatusFilter): string {
  if (status === "ativo") return METRIC_LABELS.sir.recOpen;
  if (status === "encerrado") return METRIC_LABELS.sir.closedRec;
  return METRIC_LABELS.sir.allRecords;
}

function recEmptyMessage(status: SirStatusFilter, tipoLabel?: string, cf?: string): string {
  const scope =
    status === "encerrado"
      ? "registro encerrado"
      : status === "todos"
        ? "registro"
        : "registro em aberto";
  if (tipoLabel || cf) {
    return `Nenhum ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhum registro encerrado." : `Nenhum ${scope}.`;
}

/** Painel REC com filtros por status, tipo e tabela ordenável. */
export function RecPanel({
  rows,
  total,
  byTipo,
  openCount,
  closedCount,
  activeStatus,
  activeTipo,
  activeCf,
}: RecPanelProps) {
  const tipoLabel = recTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusFilterLabel(activeStatus);

  return (
    <>
      <div className="row g-3 mb-3">
        {REC_STATUS_FILTERS.map((status) => (
          <div className="col-6 col-md-4 col-lg-3" key={status}>
            <FilterMetricCard
              label={recStatusLabel(status)}
              value={formatNumberPtBr(recStatusCount(status, openCount, closedCount))}
              href={recFilterHref({ status, tipo: activeTipo, cf: activeCf })}
              active={activeStatus === status}
              variant={status === "encerrado" ? "default" : "neutral"}
            />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4 col-lg-3">
          <FilterMetricCard
            label={METRIC_LABELS.sir.recOpen}
            value={formatNumberPtBr(total)}
            href={recFilterHref({ status: activeStatus, cf: activeCf })}
            active={!activeTipo}
            variant="neutral"
          />
        </div>
        {REC_TIPOS.map((tipo) => (
          <div className="col-6 col-md-4 col-lg-3" key={tipo.key}>
            <FilterMetricCard
              label={tipo.label}
              value={formatNumberPtBr(byTipo[tipo.prefix] ?? 0)}
              href={recFilterHref({ status: activeStatus, tipo: tipo.key, cf: activeCf })}
              active={activeTipo === tipo.key}
              variant="default"
            />
          </div>
        ))}
      </div>

      <ContentCard title={buildRecTitle(rows.length, statusLabel, tipoLabel, activeCf)}>
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={rows}
          recordLabel="REC"
          empty={recEmptyMessage(activeStatus, tipoLabel, activeCf)}
        />
      </ContentCard>
    </>
  );
}
