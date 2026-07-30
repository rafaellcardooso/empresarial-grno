"use client";

import { SdhRecordsTable } from "@/components/sdh/SdhRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  buildSdhFilterHref,
  type SdhStatusFilter,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { SdhAlarmListItem } from "@/lib/models/sdh";

type SdhNormalizedTreatmentsProps = {
  rows: SdhAlarmListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  activeVendor?: SdhVendorFilter;
  activeDdd?: string;
  activeStatus?: SdhStatusFilter;
  activeQ?: string;
  page?: number;
};

/** Exibe alarmes TMIP inativos com tratativa ainda ativa. */
export function SdhNormalizedTreatments({
  rows,
  total,
  currentPage,
  pageSize,
  activeVendor,
  activeDdd,
  activeStatus,
  activeQ,
  page,
}: SdhNormalizedTreatmentsProps) {
  if (total === 0) return null;

  return (
    <div className="mt-3">
      <ContentCard title={`${UI_COPY.normalizedAwaitingTitle} (${total})`}>
        <p className="text-body-secondary small mb-3">{UI_COPY.normalizedAwaitingSdhLead}</p>
        <SdhRecordsTable
          rows={rows}
          variant="normalized"
          empty={UI_COPY.normalizedAwaitingSdhEmpty}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(normalizedPage) =>
            buildSdhFilterHref({
              vendor: activeVendor,
              ddd: activeDdd,
              status: activeStatus,
              q: activeQ,
              page,
              normalizedPage: normalizedPage <= 1 ? undefined : normalizedPage,
            })
          }
        />
      </ContentCard>
    </div>
  );
}
