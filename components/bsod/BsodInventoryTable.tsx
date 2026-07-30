"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { BsodRecordsTable } from "@/components/bsod/BsodRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { buildBsodHref, type BsodFilterKey, type BsodUrlState } from "@/lib/config/bsod-filters";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { UI_COPY } from "@/lib/config/ui-copy";
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
  variant?: "alarms" | "inventory";
  title?: string;
  basePath?: "/bsod" | "/bsod/inventario";
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
  variant = "inventory",
  title,
  basePath = "/bsod/inventario",
}: BsodInventoryTableProps) {
  const router = useRouter();
  const suffix = filterSummary ?? (activeFilter ? filterLabel(activeFilter) : undefined);
  const titleSuffix = suffix ? ` — ${suffix}` : "";
  const cardTitle =
    title ??
    (variant === "alarms"
      ? `Alarmes BSOD${titleSuffix} (${total})`
      : `${METRIC_LABELS.bsod.inventario}${titleSuffix} (${total})`);

  function buildPageHref(page: number): string {
    return buildBsodHref({ ...activeUrlState, page: page <= 1 ? undefined : page }, basePath);
  }

  const handleSearchCommit = useCallback(
    (q: string | undefined) => {
      router.push(buildBsodHref({ ...activeUrlState, q, page: undefined }, basePath), {
        scroll: false,
      });
    },
    [router, activeUrlState, basePath],
  );

  return (
    <ContentCard
      title={cardTitle}
      headerAside={
        <CardHeaderActions>
          <ExportCsvLink href={exportHref} />
        </CardHeaderActions>
      }
    >
      <TableSearchField
        value={activeUrlState.q}
        placeholder={UI_COPY.tableSearchBsod}
        onCommit={handleSearchCommit}
      />
      <BsodRecordsTable
        rows={rows}
        tratativasByKey={tratativasByKey}
        variant={variant}
        empty={
          variant === "alarms"
            ? "Nenhum modem offline para o filtro selecionado."
            : "Nenhum PME para o filtro selecionado."
        }
      />
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
