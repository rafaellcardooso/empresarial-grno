"use client";

import { BsodRecordsTable } from "@/components/bsod/BsodRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildBsodHref, type BsodUrlState } from "@/lib/config/bsod-filters";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import type { PmeBsodRow } from "@/lib/queries/bsod";

type BsodNormalizedTreatmentsProps = {
  rows: PmeBsodRow[];
  tratativasByKey: Record<string, TratativaPublic>;
  total: number;
  currentPage: number;
  pageSize: number;
  activeUrlState: BsodUrlState;
};

/** Exibe modems online com tratativa ativa aguardando FCA e conclusão. */
export function BsodNormalizedTreatments({
  rows,
  tratativasByKey,
  total,
  currentPage,
  pageSize,
  activeUrlState,
}: BsodNormalizedTreatmentsProps) {
  if (total === 0) return null;

  return (
    <div className="mb-3">
      <ContentCard title={`${UI_COPY.normalizedAwaitingSirTitle} (${total})`}>
        <p className="text-body-secondary small px-3 pt-3 pb-2 mb-0">
          {UI_COPY.normalizedAwaitingBsodLead}
        </p>
        <BsodRecordsTable
          rows={rows}
          tratativasByKey={tratativasByKey}
          variant="normalized"
          empty={UI_COPY.normalizedAwaitingBsodEmpty}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) =>
            buildBsodHref(
              {
                ...activeUrlState,
                normalizedPage: page <= 1 ? undefined : page,
              },
              "/bsod",
            )
          }
        />
      </ContentCard>
    </div>
  );
}
