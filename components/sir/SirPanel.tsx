"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import {
  CardHeaderActions,
  CardHeaderLink,
  ExportCsvLink,
} from "@/components/ui/CardHeaderActions";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { SirTreatmentKpis } from "@/components/sir/SirTreatmentKpis";
import { TablePagination } from "@/components/ui/TablePagination";
import { RAL_TABLE_COLUMNS, REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { TratativaPublic } from "@/lib/models/tratativa";

type SirPanelProps = {
  rals: Record<string, unknown>[];
  recs: Record<string, unknown>[];
  ralTratativasByKey: Record<string, TratativaPublic>;
  recTratativasByKey: Record<string, TratativaPublic>;
  ralOpenCount: number;
  recOpenCount: number;
  ralTotal: number;
  recTotal: number;
  activeTreatmentCount: number;
  activeTreatment?: SirTreatmentFilter;
  pageSize: number;
  ralExportHref: string;
  recExportHref: string;
};

/** Painel SIR com KPIs consolidados de tratativa e tabelas RAL/REC. */
export function SirPanel({
  rals,
  recs,
  ralTratativasByKey,
  recTratativasByKey,
  ralOpenCount,
  recOpenCount,
  ralTotal,
  recTotal,
  activeTreatmentCount,
  activeTreatment,
  pageSize,
  ralExportHref,
  recExportHref,
}: SirPanelProps) {
  const activeRecordCount = ralOpenCount + recOpenCount;

  return (
    <>
      <SirTreatmentKpis
        total={activeRecordCount}
        activeTreatmentCount={activeTreatmentCount}
        activeFilter={activeTreatment}
        totalHref="/sir"
        pendingHref="/sir?tratativa=pendente"
        activeHref="/sir?tratativa=em-tratativa"
      />

      <div className="mb-3">
        <ContentCard
          title={`${METRIC_LABELS.sir.ral} — ABERTAS (${ralTotal})`}
          headerAside={
            <CardHeaderActions>
              {ralTotal > pageSize ? (
                <CardHeaderLink href={sirDomainHref("/sir/rals", activeTreatment)}>
                  Ver todas
                </CardHeaderLink>
              ) : null}
              <ExportCsvLink href={ralExportHref} />
            </CardHeaderActions>
          }
        >
          <SirRecordsTable
            columns={RAL_TABLE_COLUMNS}
            rows={rals}
            recordLabel="RAL"
            tratativasByKey={ralTratativasByKey}
            empty="Nenhuma RAL aberta."
          />
          <TablePagination
            currentPage={1}
            pageSize={pageSize}
            totalItems={ralTotal}
            buildPageHref={(page) => sirDomainHref("/sir/rals", activeTreatment, page)}
          />
        </ContentCard>
      </div>

      <ContentCard
        title={`${METRIC_LABELS.sir.recScope} — ABERTOS (${recTotal})`}
        headerAside={
          <CardHeaderActions>
            {recTotal > pageSize ? (
              <CardHeaderLink href={sirDomainHref("/sir/recs", activeTreatment)}>
                Ver todos
              </CardHeaderLink>
            ) : null}
            <ExportCsvLink href={recExportHref} />
          </CardHeaderActions>
        }
      >
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={recs}
          recordLabel="REC"
          tratativasByKey={recTratativasByKey}
          empty="Nenhum registro aberto."
        />
        <TablePagination
          currentPage={1}
          pageSize={pageSize}
          totalItems={recTotal}
          buildPageHref={(page) => sirDomainHref("/sir/recs", activeTreatment, page)}
        />
      </ContentCard>
    </>
  );
}

/** Monta link do domínio preservando o filtro consolidado de tratativa. */
function sirDomainHref(
  basePath: "/sir/rals" | "/sir/recs",
  treatment?: SirTreatmentFilter,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (treatment) params.set("tratativa", treatment);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
