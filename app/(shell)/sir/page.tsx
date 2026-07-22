import { PageHeader } from "@/components/ui/PageHeader";
import { SirPanel } from "@/components/sir/SirPanel";
import {
  countActiveRals,
  countActiveRecs,
  listActiveRals,
  listActiveRecs,
} from "@/lib/queries/sir";

export const revalidate = 30;
export const metadata = { title: "SIR" };

/** Resumo SIR com KPIs e tabelas RAL/REC. */
export default async function Page() {
  let rals: Record<string, unknown>[] = [];
  let recs: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const [ralRows, recRows] = await Promise.all([listActiveRals(), listActiveRecs()]);
    rals = ralRows as Record<string, unknown>[];
    recs = recRows as Record<string, unknown>[];
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader title="SIR" />

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <SirPanel rals={rals} recs={recs} />
      )}
    </>
  );
}
