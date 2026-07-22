import { CfRankingList } from "@/components/sir/CfRankingList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecPanel } from "@/components/sir/RecPanel";
import { StatCard } from "@/components/ui/StatCard";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { isRecTipoKey } from "@/lib/config/rec-types";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { DASHBOARD_METRICS } from "@/lib/config/ui-copy";
import { countRecsByCf, countRecsByTipo, countActiveRecs, listActiveRecs } from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "REC" };

type PageProps = {
  searchParams: Promise<{ tipo?: string; cf?: string }>;
};

/** Resumo e tabela REC/DSR/TCQ em aberto, com filtros por tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf } = await searchParams;
  const activeTipo = isRecTipoKey(tipo) ? tipo : undefined;
  const activeCf = cfFilterFromParam(cf);

  let rows: Record<string, unknown>[] = [];
  let cfRec: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let byTipo: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [recRows, total, byCf, tipoCounts] = await Promise.all([
      listActiveRecs({ cf: activeCf, tipo: activeTipo }),
      countActiveRecs(),
      countRecsByCf(),
      countRecsByTipo(),
    ]);
    rows = recRows as Record<string, unknown>[];
    totalCount = total;
    cfRec = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.rec_tipo, item.total]));
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <>
      <PageHeader title="REC" breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "REC" }]} />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard
            context={DASHBOARD_METRICS.rec.context}
            label={DASHBOARD_METRICS.rec.label}
            value={totalCount}
          />
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100 data-panel-card">
            <div className="card-header fw-semibold">{METRIC_LABELS.sir.porCf}</div>
            <ul className="list-group list-group-flush">
              <CfRankingList
                items={cfRec}
                basePath="/sir/recs"
                activeCf={activeCf}
                filterParams={{ tipo: activeTipo }}
              />
            </ul>
          </div>
        </div>
      </div>

      <RecPanel
        rows={rows}
        total={totalCount}
        byTipo={byTipo}
        activeTipo={activeTipo}
        activeCf={activeCf}
      />
    </>
  );
}
