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
import { REC_TIPOS, type RecTipoKey } from "@/lib/config/rec-types";
import { buildRecFilterHref, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { TratativaPublic } from "@/lib/models/tratativa";

export type SirRecOverviewSection = {
  tipo: RecTipoKey;
  rows: Record<string, unknown>[];
  tratativasByKey: Record<string, TratativaPublic>;
  total: number;
  exportHref: string;
};

type SirPanelProps = {
  rals: Record<string, unknown>[];
  ralTratativasByKey: Record<string, TratativaPublic>;
  ralOpenCount: number;
  ralTotal: number;
  ralExportHref: string;
  recSections: SirRecOverviewSection[];
  recOpenCount: number;
  activeTreatmentCount: number;
  activeTreatment?: SirTreatmentFilter;
  pageSize: number;
};

/** Painel SIR com KPIs consolidados e tabelas RAL/REC/DSR/TCQ. */
export function SirPanel({
  rals,
  ralTratativasByKey,
  ralOpenCount,
  ralTotal,
  ralExportHref,
  recSections,
  recOpenCount,
  activeTreatmentCount,
  activeTreatment,
  pageSize,
}: SirPanelProps) {
  const activeRecordCount = ralOpenCount + recOpenCount;
  const tipoLabel = Object.fromEntries(REC_TIPOS.map((tipo) => [tipo.key, tipo.label])) as Record<
    RecTipoKey,
    string
  >;

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
                <CardHeaderLink href={sirRalHref(activeTreatment)}>Ver todas</CardHeaderLink>
              ) : null}
              <ExportCsvLink href={ralExportHref} />
            </CardHeaderActions>
          }
        >
          <SirRecordsTable
            columns={RAL_TABLE_COLUMNS}
            rows={rals}
            domain="RAL"
            tratativasByKey={ralTratativasByKey}
            empty="Nenhuma RAL aberta."
          />
          <TablePagination
            currentPage={1}
            pageSize={pageSize}
            totalItems={ralTotal}
            buildPageHref={(page) => sirRalHref(activeTreatment, page)}
          />
        </ContentCard>
      </div>

      {recSections.map((section) => (
        <div key={section.tipo} className="mb-3">
          <ContentCard
            title={`${tipoLabel[section.tipo]} — ABERTOS (${section.total})`}
            headerAside={
              <CardHeaderActions>
                {section.total > pageSize ? (
                  <CardHeaderLink href={sirRecHref(section.tipo, activeTreatment)}>
                    Ver todos
                  </CardHeaderLink>
                ) : null}
                <ExportCsvLink href={section.exportHref} />
              </CardHeaderActions>
            }
          >
            <SirRecordsTable
              columns={REC_TABLE_COLUMNS}
              rows={section.rows}
              domain="REC"
              tratativasByKey={section.tratativasByKey}
              empty={`Nenhum ${tipoLabel[section.tipo]} aberto.`}
            />
            <TablePagination
              currentPage={1}
              pageSize={pageSize}
              totalItems={section.total}
              buildPageHref={(page) => sirRecHref(section.tipo, activeTreatment, page)}
            />
          </ContentCard>
        </div>
      ))}
    </>
  );
}

/** Monta link da listagem RAL preservando filtro de tratativa. */
function sirRalHref(treatment?: SirTreatmentFilter, page = 1): string {
  const params = new URLSearchParams();
  if (treatment) params.set("tratativa", treatment);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/sir/rals?${query}` : "/sir/rals";
}

/** Monta link da listagem REC/DSR/TCQ preservando tipo e tratativa. */
function sirRecHref(tipo: RecTipoKey, treatment?: SirTreatmentFilter, page = 1): string {
  return buildRecFilterHref("/sir/recs", {
    tipo,
    tratativa: treatment,
    page: page > 1 ? page : undefined,
  });
}
