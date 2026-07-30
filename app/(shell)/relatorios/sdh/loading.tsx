import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SdhReportLoading } from "@/components/relatorios/SdhReportLoading";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

/** Estado de carregamento da análise SDH. */
export default function Loading() {
  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>
      <PageHeader
        title={RELATORIOS_COPY.sdhPageTitle}
        description={RELATORIOS_COPY.sdhPageDescription}
      />
      <SdhReportLoading />
    </>
  );
}
