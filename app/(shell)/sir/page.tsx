import { PageHeader } from "@/components/ui/PageHeader";
import { SirPanel } from "@/components/sir/SirPanel";
import { countRals, countRecs, listActiveRals, listActiveRecs } from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "SIR" };

/** Resumo SIR com KPIs e tabelas RAL/REC. */
export default async function Page() {
  let rals: Record<string, unknown>[] = [];
  let recs: Record<string, unknown>[] = [];
  let ralOpenCount = 0;
  let ralClosedCount = 0;
  let recOpenCount = 0;
  let recClosedCount = 0;
  let error: string | null = null;

  try {
    const [ralRows, recRows, ralOpen, ralClosed, recOpen, recClosed] = await Promise.all([
      listActiveRals(),
      listActiveRecs(),
      countRals({ status: "ativo" }),
      countRals({ status: "encerrado" }),
      countRecs({ status: "ativo" }),
      countRecs({ status: "encerrado" }),
    ]);
    rals = ralRows as Record<string, unknown>[];
    recs = recRows as Record<string, unknown>[];
    ralOpenCount = ralOpen;
    ralClosedCount = ralClosed;
    recOpenCount = recOpen;
    recClosedCount = recClosed;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader title="SIR" />

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <SirPanel
          rals={rals}
          recs={recs}
          ralOpenCount={ralOpenCount}
          ralClosedCount={ralClosedCount}
          recOpenCount={recOpenCount}
          recClosedCount={recClosedCount}
        />
      )}
    </>
  );
}
