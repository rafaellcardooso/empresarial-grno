"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import { type RecTipoKey, recTipoFilterLabel } from "@/lib/config/rec-types";
import { operationalDddLabel } from "@/lib/config/locations";
import { sirStatusLabelForScope, type SirStatusFilter } from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";

type RecPanelProps = {
  rows: Record<string, unknown>[];
  tratativasByKey: Record<string, TratativaPublic>;
  total: number;
  activeStatus: SirStatusFilter;
  activeTipo?: RecTipoKey;
  activeCf?: string;
  activeDdd?: string;
  activeTreatment?: SirTreatmentFilter;
  activeQ?: string;
  currentPage: number;
  pageSize: number;
  normalizedPage?: number;
  exportHref: string;
};

function recPageHref(
  page: number,
  filters: {
    status?: SirStatusFilter;
    tipo?: RecTipoKey;
    cf?: string;
    ddd?: string;
    tratativa?: SirTreatmentFilter;
    q?: string;
    normalizedPage?: number;
  } = {},
): string {
  return buildRecFilterHref("/sir/recs", { ...filters, page });
}

function buildRecTitle(
  totalCount: number,
  statusLabel: string,
  tipoLabel?: string,
  cf?: string,
  ddd?: string,
  q?: string,
): string {
  const parts = [tipoLabel ?? METRIC_LABELS.sir.recScope, statusLabel];
  if (ddd) parts.push(operationalDddLabel(ddd));
  if (cf) parts.push(cf);
  if (q) parts.push(`“${q}”`);
  return `${parts.join(" — ")} (${totalCount})`;
}

function recEmptyMessage(
  status: SirStatusFilter,
  tipoLabel?: string,
  cf?: string,
  ddd?: string,
  q?: string,
): string {
  const scope = sirStatusLabelForScope("rec", status).toLowerCase();
  if (tipoLabel || cf || ddd || q) {
    return `Nenhum registro ${scope} para os filtros selecionados.`;
  }
  return status === "encerrado" ? "Nenhum registro encerrado." : `Nenhum registro ${scope}.`;
}

/** Painel REC com filtros por tipo, status e tabela ordenável. */
export function RecPanel({
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
}: RecPanelProps) {
  const router = useRouter();
  const tipoLabel = recTipoFilterLabel(activeTipo);
  const statusLabel = sirStatusLabelForScope("rec", activeStatus);
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
        recPageHref(1, {
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
      title={buildRecTitle(total, statusLabel, tipoLabel, activeCf, activeDdd, activeQ)}
      headerAside={
        <CardHeaderActions>
          <ExportCsvLink href={exportHref} />
        </CardHeaderActions>
      }
    >
      <TableSearchField
        value={activeQ}
        placeholder={UI_COPY.tableSearchRec}
        onCommit={handleSearchCommit}
      />
      <SirRecordsTable
        columns={REC_TABLE_COLUMNS}
        rows={rows}
        domain="REC"
        tratativasByKey={tratativasByKey}
        empty={recEmptyMessage(activeStatus, tipoLabel, activeCf, activeDdd, activeQ)}
      />
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(page) => recPageHref(page, listFilters)}
      />
    </ContentCard>
  );
}
