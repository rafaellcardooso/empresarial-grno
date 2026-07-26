import { ContentCard } from "@/components/ui/ContentCard";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

/** Placeholder enquanto o painel analítico de tratativas carrega. */
export function TratativaReportLoading() {
  return (
    <section className="relatorio-tratativa-section mb-4" aria-busy="true" aria-live="polite">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
        <div>
          <h2 className="h5 mb-1">{RELATORIOS_COPY.tratativasSectionTitle}</h2>
          <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.tratativasSectionLead}</p>
        </div>
      </div>
      <ContentCard title="Tratativas" bodyClassName="p-3">
        <p className="text-body-secondary mb-0">Carregando análise…</p>
      </ContentCard>
    </section>
  );
}
