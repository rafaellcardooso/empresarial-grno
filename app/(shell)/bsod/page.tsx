import { BsodPanel } from "@/components/bsod/BsodPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { isBsodFilterKey, parseBsodFilterParam } from "@/lib/config/bsod-filters";
import { bsodSummary, listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{ filtro?: string }>;
};

/** Inventário PME com saúde SNMP (tbl_monitor_pme). */
export default async function Page({ searchParams }: PageProps) {
  const { filtro } = await searchParams;
  const activeFilter = isBsodFilterKey(filtro) ? filtro : undefined;
  const queryFilters = parseBsodFilterParam(filtro);

  let rows: Awaited<ReturnType<typeof listPmeBsod>> = [];
  let summary = {
    total: 0,
    com_vlan: 0,
    sem_vlan: 0,
    online: 0,
    offline: 0,
    sem_leitura: 0,
    cmts: 0,
    nodes: 0,
  };
  let error: string | null = null;

  try {
    [rows, summary] = await Promise.all([listPmeBsod(queryFilters), bsodSummary()]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader title="BSOD" />

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <BsodPanel summary={summary} rows={rows} activeFilter={activeFilter} />
      )}
    </>
  );
}
