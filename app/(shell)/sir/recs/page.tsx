import { PageHeader } from "@/components/ui/PageHeader";
import { RecFilterPanel } from "@/components/sir/RecFilterPanel";
import { RecPanel } from "@/components/sir/RecPanel";
import { SirNormalizedTreatments } from "@/components/sir/SirNormalizedTreatments";
import { SirScopeNav } from "@/components/sir/SirScopeNav";
import {
  cfFilterFromParam,
  buildRecExportHref,
  searchQueryFromParam,
  sirTreatmentFromParam,
} from "@/lib/config/sir-filters";
import { operationalDddFromParam } from "@/lib/config/locations";
import { isRecTipoKey } from "@/lib/config/rec-types";
import { sirStatusFromParam } from "@/lib/config/sir-status";
import { SIR_LIST_PAGE_SIZE, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import {
  countRecs,
  countRecsByCf,
  countRecsByDdd,
  countRecsByTipo,
  listRecs,
} from "@/lib/queries/sir";
import { countActiveSirTratativasByKind } from "@/lib/queries/tratativas";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { loadTratativasForSirRows } from "@/lib/tratativa/load-for-rows";

export const dynamic = "force-dynamic";
export const metadata = { title: "REC" };

type PageProps = {
  searchParams: Promise<{
    tipo?: string;
    cf?: string;
    ddd?: string;
    status?: string;
    tratativa?: string;
    q?: string;
    page?: string;
    normalizedPage?: string;
  }>;
};

/** Resumo e tabela REC/DSR/TCQ com filtros por status, tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf, ddd, status, tratativa, q, page, normalizedPage } = await searchParams;
  const activeStatus = sirStatusFromParam(status);
  const activeTipo = isRecTipoKey(tipo) ? tipo : undefined;
  const activeCf = cfFilterFromParam(cf);
  const activeDdd = operationalDddFromParam(ddd);
  const activeTreatment = sirTreatmentFromParam(tratativa);
  const activeQ = searchQueryFromParam(q);
  const currentPage = sirPageFromParam(page);
  const currentNormalizedPage = sirPageFromParam(normalizedPage);
  const pageSize = SIR_LIST_PAGE_SIZE;
  const chipFilters = {
    status: activeStatus,
    tipo: activeTipo,
    cf: activeCf,
    ddd: activeDdd,
    tratativa: activeTreatment,
  };
  const listFilters = {
    ...chipFilters,
    q: activeQ,
    limit: pageSize,
    offset: sirListOffset(currentPage, pageSize),
  };
  const normalizedListFilters = {
    status: "encerrado" as const,
    tratativa: "em-tratativa" as const,
    ddd: activeDdd,
    limit: pageSize,
    offset: sirListOffset(currentNormalizedPage, pageSize),
  };

  let rows: Record<string, unknown>[] = [];
  let tratativasByKey: Record<string, TratativaPublic> = {};
  let normalizedRows: Record<string, unknown>[] = [];
  let normalizedTratativasByKey: Record<string, TratativaPublic> = {};
  let cfRec: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let normalizedTotal = 0;
  let totalAllTipos = 0;
  let totalAllDdds = 0;
  let treatmentTotal = 0;
  let activeTreatmentCount = 0;
  let byTipo: Record<string, number> = {};
  let dddCounts: { ddd: string; total: number }[] = [];
  let error: string | null = null;

  try {
    const [
      recRows,
      total,
      totalAll,
      allDdds,
      byCf,
      tipoCounts,
      byDdd,
      allOpen,
      activeTreatments,
      normalizedRecRows,
      normalizedCount,
    ] = await Promise.all([
      listRecs(listFilters),
      countRecs(listFilters),
      countRecs({ status: activeStatus, cf: activeCf, ddd: activeDdd }),
      countRecs({
        status: activeStatus,
        tipo: activeTipo,
        cf: activeCf,
        q: activeQ,
      }),
      countRecsByCf(activeStatus, activeDdd),
      countRecsByTipo(activeStatus, activeCf, activeDdd),
      countRecsByDdd({
        status: activeStatus,
        tipo: activeTipo,
        cf: activeCf,
        q: activeQ,
      }),
      countRecs({ status: "ativo" }),
      countActiveSirTratativasByKind("REC"),
      listRecs(normalizedListFilters),
      countRecs({
        status: "encerrado",
        tratativa: "em-tratativa",
        ddd: activeDdd,
      }),
    ]);
    rows = recRows as Record<string, unknown>[];
    normalizedRows = normalizedRecRows as Record<string, unknown>[];
    [tratativasByKey, normalizedTratativasByKey] = await Promise.all([
      loadTratativasForSirRows("REC", recRows),
      loadTratativasForSirRows("REC", normalizedRecRows),
    ]);
    totalCount = total;
    normalizedTotal = normalizedCount;
    totalAllTipos = totalAll;
    totalAllDdds = allDdds;
    treatmentTotal = allOpen;
    activeTreatmentCount = activeTreatments;
    cfRec = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.rec_tipo, item.total]));
    dddCounts = byDdd;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <>
      <PageHeader
        title="REC"
        description="Ocorrências REC/DSR/TCQ coletadas pelo SIR."
        breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "REC" }]}
      />
      <SirScopeNav active="recs" />
      <RecFilterPanel
        treatmentTotal={treatmentTotal}
        activeTreatmentCount={activeTreatmentCount}
        activeTreatment={activeTreatment}
        totalAllTipos={totalAllTipos}
        totalAllDdds={totalAllDdds}
        byTipo={byTipo}
        cfItems={cfRec}
        dddCounts={dddCounts}
        activeStatus={activeStatus}
        activeTipo={activeTipo}
        activeCf={activeCf}
        activeDdd={activeDdd}
        activeQ={activeQ}
      />

      <RecPanel
        rows={rows}
        tratativasByKey={tratativasByKey}
        total={totalCount}
        activeStatus={activeStatus}
        activeTipo={activeTipo}
        activeCf={activeCf}
        activeDdd={activeDdd}
        activeTreatment={activeTreatment}
        activeQ={activeQ}
        currentPage={currentPage}
        pageSize={pageSize}
        normalizedPage={currentNormalizedPage}
        exportHref={buildRecExportHref("/api/export/sir/recs", {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          ddd: activeDdd,
          tratativa: activeTreatment,
          q: activeQ,
        })}
      />
      <SirNormalizedTreatments
        recordLabel="REC"
        rows={normalizedRows}
        tratativasByKey={normalizedTratativasByKey}
        total={normalizedTotal}
        currentPage={currentNormalizedPage}
        pageSize={pageSize}
        listFilters={{
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          ddd: activeDdd,
          tratativa: activeTreatment,
          q: activeQ,
          page: currentPage > 1 ? currentPage : undefined,
        }}
      />
    </>
  );
}
