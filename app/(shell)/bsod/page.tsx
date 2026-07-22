import { BsodInventoryTable } from "@/components/bsod/BsodInventoryTable";
import { isBsodFilterKey, parseBsodFilterParam } from "@/lib/config/bsod-filters";
import { listPmeBsod } from "@/lib/queries/bsod";

export const dynamic = "force-dynamic";
export const metadata = { title: "BSOD" };

type PageProps = {
  searchParams: Promise<{ filtro?: string }>;
};

/** Inventário PME filtrado (KPIs ficam no layout em cache). */
export default async function Page({ searchParams }: PageProps) {
  const { filtro } = await searchParams;
  const activeFilter = isBsodFilterKey(filtro) ? filtro : undefined;
  const queryFilters = parseBsodFilterParam(filtro);

  try {
    const rows = await listPmeBsod(queryFilters);
    return <BsodInventoryTable rows={rows} activeFilter={activeFilter} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
