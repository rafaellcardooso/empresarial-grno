import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { TxPanel } from "@/components/tx/TxPanel";
import { parseTxDifParam, parseTxSearchParam, parseTxUfParam } from "@/lib/config/tx-filters";
import { TX_LIST_PAGE_SIZE, txListOffset, txPageFromParam } from "@/lib/config/tx-pagination";
import {
  countTxByUf,
  countTxDifRefByFilters,
  countTxOpticalSpans,
  getTxIngestStats,
  listTxOpticalSpans,
  pingTxDb,
} from "@/lib/queries/tx";

export const metadata = { title: "TX" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    uf?: string;
    q?: string;
    dif?: string;
    page?: string;
  }>;
};

/** Página de monitoramento TX (enlaces ópticos GRB — região MA/AM/PA/AP). */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const uf = parseTxUfParam(params.uf);
  const q = parseTxSearchParam(params.q);
  const dif = parseTxDifParam(params.dif);
  const currentPage = txPageFromParam(params.page);
  const pageSize = TX_LIST_PAGE_SIZE;

  const ping = await pingTxDb();
  if (!ping.ok) {
    return (
      <>
        <PageHeader
          title="TX"
          description="Potência óptica de transmissão (GRB) — enlaces da região MA, AM, PA e AP."
        />
        <ContentCard title="Indisponível" bodyClassName="p-3">
          <p className="text-body-secondary mb-0 small">
            Tabela ainda não disponível neste ambiente
            {ping.error ? ` (${ping.error})` : ""}. Rode as migrations e o worker{" "}
            <code>tx-ingest</code>.
          </p>
        </ContentCard>
      </>
    );
  }

  const listFilters = {
    uf,
    q,
    dif,
    limit: pageSize,
    offset: txListOffset(currentPage, pageSize),
  };

  const [rows, total, regionActiveCount, ufCounts, difCounts, stats] = await Promise.all([
    listTxOpticalSpans(listFilters),
    countTxOpticalSpans({ uf, q, dif }),
    countTxOpticalSpans({ q, dif }),
    countTxByUf({ q, dif }),
    countTxDifRefByFilters({ uf, q }),
    getTxIngestStats(),
  ]);

  return (
    <>
      <PageHeader
        title="TX"
        description="Potência óptica de transmissão (GRB) — enlaces da região MA, AM, PA e AP."
      />
      <TxPanel
        rows={rows}
        total={total}
        regionActiveCount={regionActiveCount}
        ufCounts={ufCounts}
        difCounts={difCounts}
        activeUf={uf}
        activeDif={dif}
        activeQ={q}
        currentPage={currentPage}
        pageSize={pageSize}
        lastSeenAt={stats.lastSeenAt}
      />
    </>
  );
}
