import { CfRankingList } from "@/components/sir/CfRankingList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RalPanel } from "@/components/sir/RalPanel";
import { StatCard } from "@/components/ui/StatCard";
import { cfFilterFromParam, buildSirExportHref } from "@/lib/config/sir-filters";
import { sirStatusLabelForScope, sirStatusFromParam } from "@/lib/config/sir-status";
import { SIR_LIST_PAGE_SIZE, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { isRalTipoKey, ralTipoValueFromParam } from "@/lib/config/ral-types";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { countRals, countRalsByCf, countRalsByTipo, listRals } from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "RAL" };

type PageProps = {
  searchParams: Promise<{ tipo?: string; cf?: string; status?: string; page?: string }>;
};

/** Resumo e tabela de RAL com filtros por status, tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf, status, page } = await searchParams;
  const activeStatus = sirStatusFromParam(status);
  const activeTipo = isRalTipoKey(tipo) ? tipo : undefined;
  const tipoFilter = ralTipoValueFromParam(tipo);
  const activeCf = cfFilterFromParam(cf);
  const currentPage = sirPageFromParam(page);
  const pageSize = SIR_LIST_PAGE_SIZE;
  const queryOptions = {
    status: activeStatus,
    tipo: tipoFilter,
    cf: activeCf,
    limit: pageSize,
    offset: sirListOffset(currentPage, pageSize),
  };

  let rows: Record<string, unknown>[] = [];
  let cfRal: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let totalAllTipos = 0;
  let openCount = 0;
  let closedCount = 0;
  let byTipo: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [ralRows, total, totalAll, open, closed, byCf, tipoCounts] = await Promise.all([
      listRals(queryOptions),
      countRals(queryOptions),
      countRals({ status: activeStatus, cf: activeCf }),
      countRals({ ...queryOptions, status: "ativo" }),
      countRals({ ...queryOptions, status: "encerrado" }),
      countRalsByCf(activeStatus),
      countRalsByTipo(activeStatus, activeCf),
    ]);
    rows = ralRows as Record<string, unknown>[];
    totalCount = total;
    totalAllTipos = totalAll;
    openCount = open;
    closedCount = closed;
    cfRal = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.tipo_ral, item.total]));
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const statusLabel = sirStatusLabelForScope("ral", activeStatus);

  return (
    <>
      <PageHeader title="RAL" breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "RAL" }]} />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard context={METRIC_LABELS.sir.ral} label={statusLabel} value={totalCount} />
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100 data-panel-card">
            <div className="card-header fw-semibold">{METRIC_LABELS.sir.porCf}</div>
            <ul className="list-group list-group-flush">
              <CfRankingList
                items={cfRal}
                basePath="/sir/rals"
                activeCf={activeCf}
                filterParams={{ tipo: activeTipo, status: activeStatus }}
              />
            </ul>
          </div>
        </div>
      </div>

      <RalPanel
        rows={rows}
        total={totalCount}
        totalAllTipos={totalAllTipos}
        byTipo={byTipo}
        openCount={openCount}
        closedCount={closedCount}
        activeStatus={activeStatus}
        activeTipo={activeTipo}
        activeCf={activeCf}
        currentPage={currentPage}
        pageSize={pageSize}
        exportHref={buildSirExportHref("/api/export/sir/rals", {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
        })}
      />
    </>
  );
}
