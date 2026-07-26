"use client";

import { BsodRecordsTable } from "@/components/bsod/BsodRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildBsodHref, type BsodFilterKey, type BsodUrlState } from "@/lib/config/bsod-filters";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import type { TratativaPublic } from "@/lib/models/tratativa";
import type { PmeBsodRow } from "@/lib/queries/bsod";

type BsodInventoryTableProps = {
  rows: PmeBsodRow[];
  tratativasByKey?: Record<string, TratativaPublic>;
  total: number;
  currentPage: number;
  pageSize: number;
  activeUrlState: BsodUrlState;
  activeFilter?: BsodFilterKey;
  filterSummary?: string;
  exportHref: string;
};

/** Card da listagem BSOD com tabela compacta, paginação e exportação CSV. */
export function BsodInventoryTable({
  rows,
  tratativasByKey,
  total,
  currentPage,
  pageSize,
  activeUrlState,
  activeFilter,
  filterSummary,
  exportHref,
}: BsodInventoryTableProps) {
  const suffix = filterSummary ?? (activeFilter ? filterLabel(activeFilter) : undefined);
  const titleSuffix = suffix ? ` — ${suffix}` : "";

  function buildPageHref(page: number): string {
    return buildBsodHref({ ...activeUrlState, page: page <= 1 ? undefined : page });
  }

  return (
    <ContentCard
      title={`${METRIC_LABELS.bsod.inventario}${titleSuffix} (${total})`}
      headerAside={
        <CardHeaderActions>
          <ExportCsvLink href={exportHref} />
        </CardHeaderActions>
      }
    >
      <BsodRecordsTable rows={rows} tratativasByKey={tratativasByKey} />
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={buildPageHref}
      />
    </ContentCard>
  );
}

function filterLabel(key: BsodFilterKey): string {
  const labels: Record<BsodFilterKey, string> = {
    online: METRIC_LABELS.bsod.online,
    offline: METRIC_LABELS.bsod.offline,
    sem_leitura: METRIC_LABELS.bsod.semLeitura,
    com_vlan: METRIC_LABELS.bsod.comVlan,
    sem_vlan: METRIC_LABELS.bsod.semVlan,
  };
  return labels[key];
}
