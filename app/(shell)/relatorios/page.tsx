import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Relatórios" };

/** Página de relatórios operacionais. */
export default function Page() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exportação e consultas históricas de RAL, REC e inventário BSOD."
      />
      <ContentCard title="Relatórios disponíveis">
        <p className="text-body-secondary mb-0 p-3">Nenhum relatório publicado no momento.</p>
      </ContentCard>
    </>
  );
}
