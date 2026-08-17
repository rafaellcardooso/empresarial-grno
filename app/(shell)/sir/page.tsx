import { PageHeader } from "@/components/ui/PageHeader";
import { SirPanel, type SirRecOverviewSection } from "@/components/sir/SirPanel";
import { SirScopeNav } from "@/components/sir/SirScopeNav";
import { REC_TIPOS } from "@/lib/config/rec-types";
import {
  buildRecExportHref,
  buildSirExportHref,
  sirTreatmentFromParam,
} from "@/lib/config/sir-filters";
import { SIR_LIST_PAGE_SIZE } from "@/lib/config/sir-pagination";
import { countRals, countRecs, listActiveRals, listActiveRecs } from "@/lib/queries/sir";
import { countActiveSirTratativas } from "@/lib/queries/tratativas";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { loadTratativasForSirRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "SIR" };

type PageProps = {
  searchParams: Promise<{ tratativa?: string }>;
};

/** Resumo SIR com KPIs e tabelas RAL/REC/DSR/TCQ. */
export default async function Page({ searchParams }: PageProps) {
  const { tratativa } = await searchParams;
  const activeTreatment = sirTreatmentFromParam(tratativa);
  let rals: Record<string, unknown>[] = [];
  let ralTratativasByKey: Record<string, TratativaPublic> = {};
  let recSections: SirRecOverviewSection[] = [];
  let ralOpenCount = 0;
  let recOpenCount = 0;
  let ralTotal = 0;
  let activeTreatmentCount = 0;
  let error: string | null = null;

  try {
    const listOpts = {
      tratativa: activeTreatment,
      limit: SIR_LIST_PAGE_SIZE,
      offset: 0,
    } as const;

    const [ralRows, ralOpen, ralFiltered, recOpen, activeTreatments, ...tipoBundles] =
      await Promise.all([
        listActiveRals(listOpts),
        countRals({ status: "ativo" }),
        countRals({ status: "ativo", tratativa: activeTreatment }),
        countRecs({ status: "ativo" }),
        countActiveSirTratativas(),
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
    ralOpenCount = ralOpen;
    ralTotal = ralFiltered;
    recOpenCount = recOpen;
    activeTreatmentCount = activeTreatments;
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
          pageSize={SIR_LIST_PAGE_SIZE}
        />
      )}
    </>
  );
}
