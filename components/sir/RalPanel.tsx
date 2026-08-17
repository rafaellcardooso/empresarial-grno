"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { buildSirFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import { type RalTipoKey, ralTipoFilterLabel } from "@/lib/config/ral-types";
import { operationalDddLabel } from "@/lib/config/locations";
import { sirStatusLabelForScope, type SirStatusFilter } from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { RAL_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";

type RalPanelProps = {
  rows: Record<string, unknown>[];
  tratativasByKey: Record<string, TratativaPublic>;
  total: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RalTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
  currentPage: number;
  pageSize: number;
  normalizedPage?: number;
  exportHref: string;
};

function ralPageHref(
  page: number,
  filters: {
    status?: SirStatusFilter;
    tipo?: RalTipoKey;
    cf?: string;
    ddd?: string;
    tratativa?: SirTreatmentFilter;
    q?: string;
    normalizedPage?: number;
  } = {},
): string {
  return buildSirFilterHref("/sir/rals", { ...filters, page });
}

function buildRalTitle(
  totalCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
  ddd?: string,
  q?: string,
): string {
  const parts = [METRIC_LABELS.sir.ral, statusLabel];
  if (tipoLabel) parts.push(tipoLabel);
  if (ddd) parts.push(operationalDddLabel(ddd));
  if (cf) parts.push(cf);
  if (q) parts.push(`“${q}”`);
  return `${parts.join(" — ")} (${totalCount})`;
}

function ralEmptyMessage(
  status: SirStatusFilter,
  tipoLabel?: string,
  cf?: string,
  ddd?: string,
  q?: string,
): string {
  const scope = sirStatusLabelForScope("ral", status).toLowerCase();
  if (tipoLabel || cf || ddd || q) {
    return `Nenhuma RAL ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhuma RAL encerrada." : `Nenhuma RAL ${scope}.`;
}

/** Exibe busca, exportação, tabela e paginação da listagem RAL filtrada. */
export function RalPanel({
  rows,
  tratativasByKey,
  total,
  activeStatus,
  activeTipo,
  activeCf,
  activeDdd,
  activeTreatment,
  activeQ,
  currentPage,
  pageSize,
  normalizedPage,
  exportHref,
}: RalPanelProps) {
  const router = useRouter();
  const tipoLabel = ralTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusLabelForScope("ral", activeStatus);
  const listFilters = {
    status: activeStatus,
    tipo: activeTipo,
    cf: activeCf,
    ddd: activeDdd,
    tratativa: activeTreatment,
    q: activeQ,
    normalizedPage: normalizedPage && normalizedPage > 1 ? normalizedPage : undefined,
  };

  const handleSearchCommit = useCallback(
    (q: string | undefined) => {
      router.push(
        ralPageHref(1, {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          ddd: activeDdd,
          tratativa: activeTreatment,
          q,
          normalizedPage: normalizedPage && normalizedPage > 1 ? normalizedPage : undefined,
        }),
        { scroll: false },
      );
    },
    [router, activeStatus, activeTipo, activeCf, activeDdd, activeTreatment, normalizedPage],
  );

  return (
    <ContentCard
      title={buildRalTitle(total, statusLabel, tipoLabel, activeCf, activeDdd, activeQ)}
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
        domain="RAL"
        tratativasByKey={tratativasByKey}
        empty={ralEmptyMessage(activeStatus, tipoLabel, activeCf, activeDdd, activeQ)}
      />
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(page) => ralPageHref(page, listFilters)}
      />
    </ContentCard>
  );
}
