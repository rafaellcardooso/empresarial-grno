import { PageHeader } from "@/components/ui/PageHeader";
import { SirNormalizedTreatments } from "@/components/sir/SirNormalizedTreatments";
import { SirPanel, type SirRecOverviewSection } from "@/components/sir/SirPanel";
import { SirScopeNav } from "@/components/sir/SirScopeNav";
import { REC_TIPOS } from "@/lib/config/rec-types";
import {
  buildRecExportHref,
  buildSirExportHref,
  sirTreatmentFromParam,
} from "@/lib/config/sir-filters";
import { SIR_LIST_PAGE_SIZE, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { UI_COPY } from "@/lib/config/ui-copy";
import {
  countRals,
  countRecs,
  listActiveRals,
  listActiveRecs,
  listRals,
  listRecs,
} from "@/lib/queries/sir";
import { countActiveSirTratativas } from "@/lib/queries/tratativas";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { loadTratativasForSirRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "SIR" };

type PageProps = {
  searchParams: Promise<{
    tratativa?: string;
    normalizedRalPage?: string;
    normalizedRecPage?: string;
  }>;
};

/** Resumo SIR com KPIs, pendentes de conclusão e tabelas RAL/REC/DSR/TCQ. */
export default async function Page({ searchParams }: PageProps) {
  const { tratativa, normalizedRalPage, normalizedRecPage } = await searchParams;
  const activeTreatment = sirTreatmentFromParam(tratativa);
  const pageSize = SIR_LIST_PAGE_SIZE;
  const currentNormalizedRalPage = sirPageFromParam(normalizedRalPage);
  const currentNormalizedRecPage = sirPageFromParam(normalizedRecPage);

  let rals: Record<string, unknown>[] = [];
  let ralTratativasByKey: Record<string, TratativaPublic> = {};
  let recSections: SirRecOverviewSection[] = [];
  let ralOpenCount = 0;
  let recOpenCount = 0;
  let ralTotal = 0;
  let activeTreatmentCount = 0;
  let normalizedRalRows: Record<string, unknown>[] = [];
  let normalizedRecRows: Record<string, unknown>[] = [];
  let normalizedRalTratativasByKey: Record<string, TratativaPublic> = {};
  let normalizedRecTratativasByKey: Record<string, TratativaPublic> = {};
  let normalizedRalTotal = 0;
  let normalizedRecTotal = 0;
  let error: string | null = null;

  try {
    const listOpts = {
      tratativa: activeTreatment,
      limit: pageSize,
      offset: 0,
    } as const;
    const normalizedRalFilters = {
      status: "encerrado" as const,
      tratativa: "em-tratativa" as const,
      limit: pageSize,
      offset: sirListOffset(currentNormalizedRalPage, pageSize),
    };
    const normalizedRecFilters = {
      status: "encerrado" as const,
      tratativa: "em-tratativa" as const,
      limit: pageSize,
      offset: sirListOffset(currentNormalizedRecPage, pageSize),
    };

    const [
      ralRows,
      ralOpen,
      ralFiltered,
      recOpen,
      activeTreatments,
      pendingRalRows,
      pendingRalCount,
      pendingRecRows,
      pendingRecCount,
      ...tipoBundles
    ] = await Promise.all([
      listActiveRals(listOpts),
      countRals({ status: "ativo" }),
      countRals({ status: "ativo", tratativa: activeTreatment }),
      countRecs({ status: "ativo" }),
      countActiveSirTratativas(),
      listRals(normalizedRalFilters),
      countRals({ status: "encerrado", tratativa: "em-tratativa" }),
      listRecs(normalizedRecFilters),
      countRecs({ status: "encerrado", tratativa: "em-tratativa" }),
      ...REC_TIPOS.map(async (tipo) => {
        const [rows, total] = await Promise.all([
          listActiveRecs({ ...listOpts, tipo: tipo.key }),
          countRecs({ status: "ativo", tipo: tipo.key, tratativa: activeTreatment }),
        ]);
        const tratativasByKey = await loadTratativasForSirRows("REC", rows);
        return {
          tipo: tipo.key,
          rows: rows as Record<string, unknown>[],
          tratativasByKey,
          total,
          exportHref: buildRecExportHref("/api/export/sir/recs", {
            status: "ativo",
            tipo: tipo.key,
            tratativa: activeTreatment,
          }),
        } satisfies SirRecOverviewSection;
      }),
    ]);

    rals = ralRows as Record<string, unknown>[];
    ralTratativasByKey = await loadTratativasForSirRows("RAL", ralRows);
    normalizedRalRows = pendingRalRows as Record<string, unknown>[];
    normalizedRecRows = pendingRecRows as Record<string, unknown>[];
    [normalizedRalTratativasByKey, normalizedRecTratativasByKey] = await Promise.all([
      loadTratativasForSirRows("RAL", pendingRalRows),
      loadTratativasForSirRows("REC", pendingRecRows),
    ]);
    ralOpenCount = ralOpen;
    ralTotal = ralFiltered;
    recOpenCount = recOpen;
    activeTreatmentCount = activeTreatments;
    normalizedRalTotal = pendingRalCount;
    normalizedRecTotal = pendingRecCount;
    recSections = tipoBundles;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader
        title="SIR"
        description="Visão geral das ocorrências RAL, REC, DSR e TCQ coletadas pelo SIR."
      />
      <SirScopeNav active="overview" />

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <SirNormalizedTreatments
            domain="RAL"
            rows={normalizedRalRows}
            tratativasByKey={normalizedRalTratativasByKey}
            total={normalizedRalTotal}
            currentPage={currentNormalizedRalPage}
            pageSize={pageSize}
            listFilters={{}}
            title={`${UI_COPY.normalizedAwaitingSirTitle} — RAL`}
          />
          <SirNormalizedTreatments
            domain="REC"
            rows={normalizedRecRows}
            tratativasByKey={normalizedRecTratativasByKey}
            total={normalizedRecTotal}
            currentPage={currentNormalizedRecPage}
            pageSize={pageSize}
            listFilters={{}}
            title={`${UI_COPY.normalizedAwaitingSirTitle} — REC`}
          />
          <SirPanel
            rals={rals}
            ralTratativasByKey={ralTratativasByKey}
            ralOpenCount={ralOpenCount}
            ralTotal={ralTotal}
            ralExportHref={buildSirExportHref("/api/export/sir/rals", {
              status: "ativo",
              tratativa: activeTreatment,
            })}
            recSections={recSections}
            recOpenCount={recOpenCount}
            activeTreatmentCount={activeTreatmentCount}
            activeTreatment={activeTreatment}
            pageSize={pageSize}
          />
        </>
      )}
    </>
  );
}
