import { CfRankingList } from "@/components/sir/CfRankingList";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { StatCard } from "@/components/ui/StatCard";
import { cfFilterFromParam } from "@/lib/config/sir-filters";
import { REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { DASHBOARD_METRICS } from "@/lib/config/ui-copy";
import { countRecsByCf, listActiveRecs } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";
export const metadata = { title: "REC" };

type PageProps = {
  searchParams: Promise<{ cf?: string }>;
};

/** Resumo e tabela de REC em aberto, com filtro por CF. */
export default async function Page({ searchParams }: PageProps) {
  const { cf } = await searchParams;
  const activeCf = cfFilterFromParam(cf);

  let rows: Record<string, unknown>[] = [];
  let cfRec: { cf_executante: string; total: number }[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const [recRows, allRecs, byCf] = await Promise.all([
      listActiveRecs({ cf: activeCf }),
      listActiveRecs(),
      countRecsByCf(),
    ]);
    rows = recRows as Record<string, unknown>[];
    total = allRecs.length;
    cfRec = byCf;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const tableTitle = activeCf
    ? `${METRIC_LABELS.sir.registros} — ${activeCf} (${rows.length})`
    : `${METRIC_LABELS.sir.registros} (${rows.length})`;

  return (
    <>
      <PageHeader
        title="REC"
        breadcrumbs={[
          { label: "SIR", href: "/sir" },
          { label: "REC" },
        ]}
      />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard
            context={DASHBOARD_METRICS.rec.context}
            label={DASHBOARD_METRICS.rec.label}
            value={total}
          />
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100 data-panel-card">
            <div className="card-header fw-semibold">{METRIC_LABELS.sir.porCf}</div>
            <ul className="list-group list-group-flush">
              <CfRankingList items={cfRec} basePath="/sir/recs" activeCf={activeCf} />
            </ul>
          </div>
        </div>
      </div>

      <ContentCard title={tableTitle}>
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={rows}
          recordLabel="REC"
          empty={
            activeCf
              ? "Nenhuma REC em aberto para o CF selecionado."
              : "Nenhuma REC em aberto."
          }
        />
      </ContentCard>
    </>
  );
}
