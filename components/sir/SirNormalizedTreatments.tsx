"use client";

import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  buildRecFilterHref,
  buildSirFilterHref,
  type SirCfFilterParams,
  type SirRecFilterParams,
} from "@/lib/config/sir-filters";
import { RAL_TABLE_COLUMNS, REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";

type SirNormalizedTreatmentsProps = {
  recordLabel: "RAL" | "REC";
  rows: Record<string, unknown>[];
  tratativasByKey: Record<string, TratativaPublic>;
  total: number;
  currentPage: number;
  pageSize: number;
  listFilters: SirCfFilterParams | SirRecFilterParams;
};

/** Exibe registros encerrados na fonte com tratativa ainda ativa. */
export function SirNormalizedTreatments({
  recordLabel,
  rows,
  tratativasByKey,
  total,
  currentPage,
  pageSize,
  listFilters,
}: SirNormalizedTreatmentsProps) {
  if (total === 0) return null;

  const basePath = recordLabel === "RAL" ? "/sir/rals" : "/sir/recs";
  const columns = recordLabel === "RAL" ? RAL_TABLE_COLUMNS : REC_TABLE_COLUMNS;

  function buildHref(normalizedPage: number): string {
    const next = {
      ...listFilters,
      normalizedPage: normalizedPage <= 1 ? undefined : normalizedPage,
    };
    return recordLabel === "RAL"
      ? buildSirFilterHref(basePath, next as SirCfFilterParams)
      : buildRecFilterHref(basePath, next as SirRecFilterParams);
  }

  return (
    <div className="mt-3">
      <ContentCard title={`${UI_COPY.normalizedAwaitingTitle} (${total})`}>
        <p className="text-body-secondary small mb-3">{UI_COPY.normalizedAwaitingSirLead}</p>
        <SirRecordsTable
          columns={columns}
          rows={rows}
          recordLabel={recordLabel}
          tratativasByKey={tratativasByKey}
          variant="normalized"
          empty={UI_COPY.normalizedAwaitingSirEmpty}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={buildHref}
        />
      </ContentCard>
    </div>
  );
}
