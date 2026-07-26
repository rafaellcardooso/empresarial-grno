import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { RelatorioExportSection } from "@/components/relatorios/RelatorioExportSection";
import { RelatoriosHub } from "@/components/relatorios/RelatoriosHub";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

export const metadata = { title: "Relatórios" };

/** Hub de relatórios operacionais. */
export default function Page() {
  return (
    <>
      <PageHeader
        title={RELATORIOS_COPY.hubTitle}
        description={RELATORIOS_COPY.hubDescription}
        aside={
          <Link href="#exportacao-csv" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-download me-1" aria-hidden="true" />
            {RELATORIOS_COPY.exportHubLink}
          </Link>
        }
      />
      <RelatoriosHub />
      <RelatorioExportSection />
    </>
  );
}
