import Link from "next/link";
import { TxReportPanel } from "@/components/relatorios/TxReportPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { getTxReportSummary } from "@/lib/queries/tx-report";

export const dynamic = "force-dynamic";
export const metadata = { title: "TX" };

/** Relatório analítico dos enlaces ópticos TX na região. */
export default async function Page() {
  let summary;
  try {
    summary = await getTxReportSummary();
  } catch {
    summary = null;
  }

  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>

      <PageHeader
        title={RELATORIOS_COPY.txPageTitle}
        description={RELATORIOS_COPY.txPageDescription}
      />

      {summary ? (
        <TxReportPanel summary={summary} />
      ) : (
        <ContentCard title="Indisponível" bodyClassName="p-3">
          <p className="text-body-secondary mb-0 small">
            Não foi possível carregar o relatório TX neste ambiente. Confirme as migrations e o
            worker <code>tx-ingest</code>.
          </p>
        </ContentCard>
      )}
    </>
  );
}
