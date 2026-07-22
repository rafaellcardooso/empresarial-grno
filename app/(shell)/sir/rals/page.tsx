import { CfRankingList } from "@/components/sir/CfRankingList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RalPanel } from "@/components/sir/RalPanel";
import { StatCard } from "@/components/ui/StatCard";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { isRalTipoKey, ralTipoValueFromParam } from "@/lib/config/ral-types";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { DASHBOARD_METRICS } from "@/lib/config/ui-copy";
import { countRalsByCf, countRalsByTipo, countActiveRals, listActiveRals } from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "RAL" };

type PageProps = {
  searchParams: Promise<{ tipo?: string; cf?: string }>;
};

/** Resumo e tabela de RAL em aberto, com filtros por tipo e CF. */
export default async function Page({ searchParams }: PageProps) {
  const { tipo, cf } = await searchParams;
  const activeTipo = isRalTipoKey(tipo) ? tipo : undefined;
  const tipoFilter = ralTipoValueFromParam(tipo);
  const activeCf = cfFilterFromParam(cf);

  let rows: Record<string, unknown>[] = [];
  let cfRal: { cf_executante: string; total: number }[] = [];
  let totalCount = 0;
  let byTipo: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [ralRows, total, byCf, tipoCounts] = await Promise.all([
      listActiveRals({ tipo: tipoFilter, cf: activeCf }),
      countActiveRals(),
      countRalsByCf(),
      countRalsByTipo(),
    ]);
    rows = ralRows as Record<string, unknown>[];
    totalCount = total;
    cfRal = byCf;
    byTipo = Object.fromEntries(tipoCounts.map((item) => [item.tipo_ral, item.total]));
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <>
      <PageHeader title="RAL" breadcrumbs={[{ label: "SIR", href: "/sir" }, { label: "RAL" }]} />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard
            context={DASHBOARD_METRICS.ral.context}
            label={DASHBOARD_METRICS.ral.label}
            value={totalCount}
          />
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100 data-panel-card">
            <div className="card-header fw-semibold">{METRIC_LABELS.sir.porCf}</div>
            <ul className="list-group list-group-flush">
              <CfRankingList
                items={cfRal}
                basePath="/sir/rals"
                activeCf={activeCf}
                filterParams={{ tipo: activeTipo }}
              />
            </ul>
          </div>
        </div>
      </div>

      <RalPanel
        rows={rows}
        total={totalCount}
        byTipo={byTipo}
        activeTipo={activeTipo}
        activeCf={activeCf}
      />
    </>
  );
}
