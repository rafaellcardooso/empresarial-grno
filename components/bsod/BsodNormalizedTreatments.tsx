"use client";

import { BsodRecordsTable } from "@/components/bsod/BsodRecordsTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildBsodHref, type BsodUrlState } from "@/lib/config/bsod-filters";
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

/** Exibe tratativas ativas de modems que retornaram ao estado online. */
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
    <div className="mt-3">
      <ContentCard title={`Normalizados aguardando validação (${total})`}>
        <p className="text-body-secondary small mb-3">
          Modems online com tratativa ativa permanecem visíveis até a validação, conclusão ou
          liberação.
        </p>
        <BsodRecordsTable
          rows={rows}
          tratativasByKey={tratativasByKey}
          variant="normalized"
          empty="Nenhuma tratativa normalizada aguardando validação."
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
