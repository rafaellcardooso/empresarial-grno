import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "TMIP" };

/** Página placeholder de monitoramento TMIP. */
export default function Page() {
  return (
    <>
      <PageHeader title="TMIP" description="Monitoramento TMIP — módulo em desenvolvimento." />
      <ContentCard title="Em breve">
        <p className="text-body-secondary mb-0 p-3">
          Esta área será disponibilizada em uma próxima versão.
        </p>
      </ContentCard>
    </>
  );
}
