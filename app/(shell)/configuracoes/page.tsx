import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Configurações" };

/** Página de configurações do aplicativo. */
export default function Page() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Preferências de exibição e parâmetros operacionais."
      />
      <ContentCard title="Preferências">
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>Tema da interface</span>
            <span className="text-body-secondary small">Claro / escuro (navbar)</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>Menu lateral</span>
            <span className="text-body-secondary small">Expandido / recolhido (navbar)</span>
          </li>
        </ul>
      </ContentCard>
    </>
  );
}
