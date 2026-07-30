import { PageHeader } from "@/components/ui/PageHeader";
import { RalFilterPanel } from "@/components/sir/RalFilterPanel";
import { RalPanel } from "@/components/sir/RalPanel";
import { SirScopeNav } from "@/components/sir/SirScopeNav";
import {
  cfFilterFromParam,
  buildSirExportHref,
  searchQueryFromParam,
  sirTreatmentFromParam,
} from "@/lib/config/sir-filters";
import { operationalDddFromParam } from "@/lib/config/locations";
import { sirStatusFromParam } from "@/lib/config/sir-status";
import { SIR_LIST_PAGE_SIZE, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { isRalTipoKey, ralTipoValueFromParam } from "@/lib/config/ral-types";
import {
  countRals,
  countRalsByCf,
  countRalsByDdd,
  countRalsByTipo,
  listRals,
} from "@/lib/queries/sir";
import { countActiveSirTratativasByKind } from "@/lib/queries/tratativas";
import { loadTratativasForSirRows } from "@/lib/tratativa/load-for-rows";
import type { TratativaPublic } from "@/lib/models/tratativa";

export const dynamic = "force-dynamic";
export const metadata = { title: "RAL" };

type PageProps = {
  searchParams: Promise<{
    tipo?: string;
    cf?: string;
    ddd?: string;
    status?: string;
    tratativa?: string;
    q?: string;
    page?: string;
  }>;
};

/** Resumo e tabela de RAL com filtros por status, tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf, ddd, status, tratativa, q, page } = await searchParams;
  const activeStatus = sirStatusFromParam(status);
  const activeTipo = isRalTipoKey(tipo) ? tipo : undefined;
  const tipoFilter = ralTipoValueFromParam(tipo);
  const activeCf = cfFilterFromParam(cf);
  const activeDdd = operationalDddFromParam(ddd);
  const activeTreatment = sirTreatmentFromParam(tratativa);
  const activeQ = searchQueryFromParam(q);
  const currentPage = sirPageFromParam(page);
  const pageSize = SIR_LIST_PAGE_SIZE;
  const chipFilters = {
    status: activeStatus,
    tipo: tipoFilter,
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

  let rows: Record<string, unknown>[] = [];
  let tratativasByKey: Record<string, TratativaPublic> = {};
  let cfRal: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let totalAllTipos = 0;
  let totalAllDdds = 0;
  let treatmentTotal = 0;
  let activeTreatmentCount = 0;
  let byTipo: Record<string, number> = {};
  let dddCounts: { ddd: string; total: number }[] = [];
  let error: string | null = null;

  try {
    const [ralRows, total, totalAll, allDdds, byCf, tipoCounts, byDdd, allOpen, activeTreatments] =
      await Promise.all([
        listRals(listFilters),
        countRals(listFilters),
        countRals({ status: activeStatus, cf: activeCf, ddd: activeDdd }),
        countRals({
          status: activeStatus,
          tipo: tipoFilter,
          cf: activeCf,
          q: activeQ,
        }),
        countRalsByCf(activeStatus, activeDdd),
        countRalsByTipo(activeStatus, activeCf, activeDdd),
        countRalsByDdd({
          status: activeStatus,
          tipo: tipoFilter,
          cf: activeCf,
          q: activeQ,
        }),
        countRals({ status: "ativo" }),
        countActiveSirTratativasByKind("RAL"),
      ]);
    rows = ralRows as Record<string, unknown>[];
    tratativasByKey = await loadTratativasForSirRows("RAL", ralRows);
    totalCount = total;
    totalAllTipos = totalAll;
    totalAllDdds = allDdds;
    treatmentTotal = allOpen;
    activeTreatmentCount = activeTreatments;
    cfRal = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.tipo_ral, item.total]));
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
        title="RAL"
        description="Ocorrências RAL com filtros por status, classificação, DDD e CF executante."
        breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "RAL" }]}
      />
      <SirScopeNav active="rals" />
      <RalFilterPanel
        treatmentTotal={treatmentTotal}
        activeTreatmentCount={activeTreatmentCount}
        activeTreatment={activeTreatment}
        totalAllTipos={totalAllTipos}
        totalAllDdds={totalAllDdds}
        byTipo={byTipo}
        cfItems={cfRal}
        dddCounts={dddCounts}
        activeStatus={activeStatus}
        activeTipo={activeTipo}
        activeCf={activeCf}
        activeDdd={activeDdd}
        activeQ={activeQ}
      />

      <RalPanel
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
        exportHref={buildSirExportHref("/api/export/sir/rals", {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          ddd: activeDdd,
          tratativa: activeTreatment,
          q: activeQ,
        })}
      />
    </>
  );
}
