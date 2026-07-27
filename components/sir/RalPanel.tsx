"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { SirFilterToolbar, type SirFilterChipItem } from "@/components/sir/SirFilterToolbar";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { buildSirFilterHref } from "@/lib/config/sir-filters";
import {
  RAL_TIPOS,
  type RalTipoKey,
  getRalTipoDefinition,
  ralTipoFilterLabel,
} from "@/lib/config/ral-types";
import {
  SIR_STATUS_FILTER_ORDER,
  sirStatusLabelForScope,
  type SirStatusFilter,
} from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { RAL_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { UI_COPY } from "@/lib/config/ui-copy";

type RalPanelProps = {
  rows: Record<string, unknown>[];
  total: number;
  totalAllTipos: number;
  byTipo: Record<string, number>;
  openCount: number;
  closedCount: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
  activeQ?: string;
  currentPage: number;
  pageSize: number;
  exportHref: string;
};

function ralPageHref(
  page: number,
  filters: {
    status?: SirStatusFilter;
    tipo?: RalTipoKey;
    cf?: string;
    q?: string;
  } = {},
): string {
  return buildSirFilterHref("/sir/rals", { ...filters, page });
}

function statusChipLabel(filter: SirStatusFilter): string {
  const label = sirStatusLabelForScope("ral", filter);
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function buildRalTitle(
  totalCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
  q?: string,
): string {
  const parts = [METRIC_LABELS.sir.ral, statusLabel];
  if (tipoLabel) parts.push(tipoLabel);
  if (cf) parts.push(cf);
  if (q) parts.push(`“${q}”`);
  return `${parts.join(" — ")} (${totalCount})`;
}

function ralStatusCount(status: SirStatusFilter, openCount: number, closedCount: number): number {
  if (status === "ativo") return openCount;
  if (status === "encerrado") return closedCount;
  return openCount + closedCount;
}

function ralEmptyMessage(
  status: SirStatusFilter,
  tipoLabel?: string,
  cf?: string,
  q?: string,
): string {
  const scope = sirStatusLabelForScope("ral", status).toLowerCase();
  if (tipoLabel || cf || q) {
    return `Nenhuma RAL ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhuma RAL encerrada." : `Nenhuma RAL ${scope}.`;
}

/** Painel RAL com filtros por tipo, status e tabela ordenável. */
export function RalPanel({
  rows,
  total,
  totalAllTipos,
  byTipo,
  openCount,
  closedCount,
  activeStatus,
  activeTipo,
  activeCf,
  activeQ,
  currentPage,
  pageSize,
  exportHref,
}: RalPanelProps) {
  const router = useRouter();
  const tipoLabel = ralTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusLabelForScope("ral", activeStatus);
  const listFilters = { status: activeStatus, tipo: activeTipo, cf: activeCf, q: activeQ };

  const handleSearchCommit = useCallback(
    (q: string | undefined) => {
      router.push(
        ralPageHref(1, {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          q,
        }),
        { scroll: false },
      );
    },
    [router, activeStatus, activeTipo, activeCf],
  );

  const statusChips: SirFilterChipItem[] = SIR_STATUS_FILTER_ORDER.map((status) => ({
    key: status,
    label: statusChipLabel(status),
    count: ralStatusCount(status, openCount, closedCount),
    href: ralPageHref(1, { status, tipo: activeTipo, cf: activeCf, q: activeQ }),
    active: activeStatus === status,
  }));

  const tipoChips: SirFilterChipItem[] = [
    {
      key: "all",
      label: "Todos os tipos",
      count: totalAllTipos,
      href: ralPageHref(1, { status: activeStatus, cf: activeCf, q: activeQ }),
      active: !activeTipo,
    },
    ...RAL_TIPOS.map((tipo) => {
      const count = byTipo[tipo.value] ?? 0;
      return {
        key: tipo.key,
        label: tipo.chipLabel,
        count,
        href: ralPageHref(1, {
          status: activeStatus,
          tipo: tipo.key,
          cf: activeCf,
          q: activeQ,
        }),
        active: activeTipo === tipo.key,
        accentClass: tipo.filterClass,
        hidden: count === 0 && activeTipo !== tipo.key,
      };
    }),
    ...Object.entries(byTipo)
      .filter(([value, count]) => count > 0 && !getRalTipoDefinition(value))
      .map(([value, count]) => ({
        key: value,
        label: value,
        count,
        href: ralPageHref(1, { status: activeStatus, cf: activeCf, q: activeQ }),
        active: false,
      })),
  ];

  return (
    <>
      <SirFilterToolbar statusChips={statusChips} tipoChips={tipoChips} />

      <ContentCard
        title={buildRalTitle(total, statusLabel, tipoLabel, activeCf, activeQ)}
        headerAside={
          <CardHeaderActions>
            <ExportCsvLink href={exportHref} />
          </CardHeaderActions>
        }
      >
        <TableSearchField
          value={activeQ}
          placeholder={UI_COPY.tableSearchRal}
          onCommit={handleSearchCommit}
        />
        <SirRecordsTable
          columns={RAL_TABLE_COLUMNS}
          rows={rows}
          recordLabel="RAL"
          empty={ralEmptyMessage(activeStatus, tipoLabel, activeCf, activeQ)}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) => ralPageHref(page, listFilters)}
        />
      </ContentCard>
    </>
  );
}
