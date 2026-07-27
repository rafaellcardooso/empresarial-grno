import { CfRankingList } from "@/components/sir/CfRankingList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecPanel } from "@/components/sir/RecPanel";
import { StatCard } from "@/components/ui/StatCard";
import {
  cfFilterFromParam,
  buildRecExportHref,
  searchQueryFromParam,
} from "@/lib/config/sir-filters";
import { isRecTipoKey } from "@/lib/config/rec-types";
import { sirStatusLabelForScope, sirStatusFromParam } from "@/lib/config/sir-status";
import { SIR_LIST_PAGE_SIZE, sirListOffset, sirPageFromParam } from "@/lib/config/sir-pagination";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { countRecs, countRecsByCf, countRecsByTipo, listRecs } from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "REC" };

type PageProps = {
  searchParams: Promise<{
    tipo?: string;
    cf?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
};

/** Resumo e tabela REC/DSR/TCQ com filtros por status, tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf, status, q, page } = await searchParams;
  const activeStatus = sirStatusFromParam(status);
  const activeTipo = isRecTipoKey(tipo) ? tipo : undefined;
  const activeCf = cfFilterFromParam(cf);
  const activeQ = searchQueryFromParam(q);
  const currentPage = sirPageFromParam(page);
  const pageSize = SIR_LIST_PAGE_SIZE;
  const chipFilters = {
    status: activeStatus,
    tipo: activeTipo,
    cf: activeCf,
  };
  const listFilters = {
    ...chipFilters,
    q: activeQ,
    limit: pageSize,
    offset: sirListOffset(currentPage, pageSize),
  };

  let rows: Record<string, unknown>[] = [];
  let cfRec: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let kpiTotal = 0;
  let totalAllTipos = 0;
  let openCount = 0;
  let closedCount = 0;
  let byTipo: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [recRows, total, kpi, totalAll, open, closed, byCf, tipoCounts] = await Promise.all([
      listRecs(listFilters),
      countRecs(listFilters),
      countRecs(chipFilters),
      countRecs({ status: activeStatus, cf: activeCf }),
      countRecs({ ...chipFilters, status: "ativo" }),
      countRecs({ ...chipFilters, status: "encerrado" }),
      countRecsByCf(activeStatus),
      countRecsByTipo(activeStatus, activeCf),
    ]);
    rows = recRows as Record<string, unknown>[];
    totalCount = total;
    kpiTotal = kpi;
    totalAllTipos = totalAll;
    openCount = open;
    closedCount = closed;
    cfRec = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.rec_tipo, item.total]));
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const statusLabel = sirStatusLabelForScope("rec", activeStatus);

  return (
    <>
      <PageHeader title="REC" breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "REC" }]} />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard context={METRIC_LABELS.sir.rec} label={statusLabel} value={kpiTotal} />
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100 data-panel-card">
            <div className="card-header fw-semibold">{METRIC_LABELS.sir.porCf}</div>
            <ul className="list-group list-group-flush cf-ranking-list">
              <CfRankingList
                items={cfRec}
                basePath="/sir/recs"
                activeCf={activeCf}
                filterParams={{ tipo: activeTipo, status: activeStatus, q: activeQ }}
              />
            </ul>
          </div>
        </div>
      </div>

      <RecPanel
        rows={rows}
        total={totalCount}
        totalAllTipos={totalAllTipos}
        byTipo={byTipo}
        openCount={openCount}
        closedCount={closedCount}
        activeStatus={activeStatus}
        activeTipo={activeTipo}
        activeCf={activeCf}
        activeQ={activeQ}
        currentPage={currentPage}
        pageSize={pageSize}
        exportHref={buildRecExportHref("/api/export/sir/recs", {
          status: activeStatus,
          tipo: activeTipo,
          cf: activeCf,
          q: activeQ,
        })}
      />
    </>
  );
}
