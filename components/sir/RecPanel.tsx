"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { SirFilterToolbar, type SirFilterChipItem } from "@/components/sir/SirFilterToolbar";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildRecFilterHref } from "@/lib/config/sir-filters";
import { REC_TIPOS, type RecTipoKey, recTipoFilterLabel } from "@/lib/config/rec-types";
import {
  SIR_STATUS_FILTER_ORDER,
  sirStatusLabelForScope,
  type SirStatusFilter,
} from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";

type RecPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  totalAllTipos: number;
  byTipo: Record<string, number>;
  openCount: number;
  closedCount: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  currentPage: number;
  pageSize: number;
};

function recPageHref(
  page: number,
  filters: {
    status?: SirStatusFilter;
    tipo?: RecTipoKey;
    cf?: string;
  } = {},
): string {
  return buildRecFilterHref("/sir/recs", { ...filters, page });
}

function statusChipLabel(filter: SirStatusFilter): string {
  const label = sirStatusLabelForScope("rec", filter);
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function buildRecTitle(
  totalCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
): string {
  const parts = [METRIC_LABELS.sir.rec, statusLabel];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  return `${parts.join(" — ")} (${totalCount})`;
}

function recStatusCount(status: SirStatusFilter, openCount: number, closedCount: number): number {
  if (status === "ativo") return openCount;
  if (status === "encerrado") return closedCount;
  return openCount + closedCount;
}

function recEmptyMessage(status: SirStatusFilter, tipoLabel?: string, cf?: string): string {
  const scope = sirStatusLabelForScope("rec", status).toLowerCase();
  if (tipoLabel || cf) {
    return `Nenhum registro ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhum registro encerrado." : `Nenhum registro ${scope}.`;
}

/** Painel REC com filtros por tipo, status e tabela ordenável. */
export function RecPanel({
  rows,
  total,
  totalAllTipos,
  byTipo,
  openCount,
  closedCount,
  activeStatus,
  activeTipo,
  activeCf,
  currentPage,
  pageSize,
}: RecPanelProps) {
  const tipoLabel = recTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusLabelForScope("rec", activeStatus);
  const listFilters = { status: activeStatus, tipo: activeTipo, cf: activeCf };

  const statusChips: SirFilterChipItem[] = SIR_STATUS_FILTER_ORDER.map((status) => ({
    key: status,
    label: statusChipLabel(status),
    count: recStatusCount(status, openCount, closedCount),
    href: recPageHref(1, { status, tipo: activeTipo, cf: activeCf }),
    active: activeStatus === status,
  }));

  const tipoChips: SirFilterChipItem[] = [
    {
      key: "all",
      label: "Todos os tipos",
      count: totalAllTipos,
      href: recPageHref(1, { status: activeStatus, cf: activeCf }),
      active: !activeTipo,
    },
    ...REC_TIPOS.map((tipo) => {
      const count = byTipo[tipo.prefix] ?? 0;
      return {
        key: tipo.key,
        label: tipo.chipLabel,
        count,
        href: recPageHref(1, { status: activeStatus, tipo: tipo.key, cf: activeCf }),
        active: activeTipo === tipo.key,
        accentClass: tipo.filterClass,
        hidden: count === 0 && activeTipo !== tipo.key,
      };
    }),
  ];

  return (
    <>
      <SirFilterToolbar statusChips={statusChips} tipoChips={tipoChips} />

      <ContentCard title={buildRecTitle(total, statusLabel, tipoLabel, activeCf)}>
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={rows}
          recordLabel="REC"
          empty={recEmptyMessage(activeStatus, tipoLabel, activeCf)}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) => recPageHref(page, listFilters)}
        />
      </ContentCard>
    </>
  );
}
