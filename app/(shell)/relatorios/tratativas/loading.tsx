import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { TratativaReportLoading } from "@/components/relatorios/TratativaReportLoading";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

/** Estado de carregamento da análise de tratativas. */
export default function Loading() {
  return (
    <>
      <Link href="/relatorios" className="relatorio-subpage-back">
        <i className="bi bi-arrow-left" aria-hidden="true" /> {RELATORIOS_COPY.backToHub}
      </Link>
      <PageHeader
        title={RELATORIOS_COPY.tratativasPageTitle}
        description={RELATORIOS_COPY.tratativasPageDescription}
      />
      <TratativaReportLoading />
    </>
  );
}
