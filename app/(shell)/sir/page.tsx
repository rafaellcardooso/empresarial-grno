import { PageHeader } from "@/components/ui/PageHeader";
import { SirPanel } from "@/components/sir/SirPanel";
import { SirScopeNav } from "@/components/sir/SirScopeNav";
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

/** Resumo SIR com KPIs e tabelas RAL/REC. */
export default async function Page({ searchParams }: PageProps) {
  const { tratativa } = await searchParams;
  const activeTreatment = sirTreatmentFromParam(tratativa);
  let rals: Record<string, unknown>[] = [];
  let recs: Record<string, unknown>[] = [];
  let ralTratativasByKey: Record<string, TratativaPublic> = {};
  let recTratativasByKey: Record<string, TratativaPublic> = {};
  let ralOpenCount = 0;
  let recOpenCount = 0;
  let ralTotal = 0;
  let recTotal = 0;
  let activeTreatmentCount = 0;
  let error: string | null = null;

  try {
    const [ralRows, recRows, ralOpen, recOpen, ralFiltered, recFiltered, activeTreatments] =
      await Promise.all([
        listActiveRals({
          tratativa: activeTreatment,
          limit: SIR_LIST_PAGE_SIZE,
          offset: 0,
        }),
        listActiveRecs({
          tratativa: activeTreatment,
          limit: SIR_LIST_PAGE_SIZE,
          offset: 0,
        }),
        countRals({ status: "ativo" }),
        countRecs({ status: "ativo" }),
        countRals({ status: "ativo", tratativa: activeTreatment }),
        countRecs({ status: "ativo", tratativa: activeTreatment }),
        countActiveSirTratativas(),
      ]);
    rals = ralRows as Record<string, unknown>[];
    recs = recRows as Record<string, unknown>[];
    [ralTratativasByKey, recTratativasByKey] = await Promise.all([
      loadTratativasForSirRows("RAL", ralRows),
      loadTratativasForSirRows("REC", recRows),
    ]);
    ralOpenCount = ralOpen;
    recOpenCount = recOpen;
    ralTotal = ralFiltered;
    recTotal = recFiltered;
    activeTreatmentCount = activeTreatments;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader
        title="SIR"
        description="Visão geral das ocorrências RAL e REC coletadas pelo SIR."
      />
      <SirScopeNav active="overview" />

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <SirPanel
          rals={rals}
          recs={recs}
          ralTratativasByKey={ralTratativasByKey}
          recTratativasByKey={recTratativasByKey}
          ralOpenCount={ralOpenCount}
          recOpenCount={recOpenCount}
          ralTotal={ralTotal}
          recTotal={recTotal}
          activeTreatmentCount={activeTreatmentCount}
          activeTreatment={activeTreatment}
          pageSize={SIR_LIST_PAGE_SIZE}
          ralExportHref={buildSirExportHref("/api/export/sir/rals", {
            status: "ativo",
            tratativa: activeTreatment,
          })}
          recExportHref={buildRecExportHref("/api/export/sir/recs", {
            status: "ativo",
            tratativa: activeTreatment,
          })}
        />
      )}
    </>
  );
}
