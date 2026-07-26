import { RelatoriosPanel } from "@/components/relatorios/RelatoriosPanel";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

/** Seção de exportação CSV no hub de relatórios (abaixo dos cards analíticos). */
export function RelatorioExportSection() {
  return (
    <section
      className="relatorio-hub-export"
      id="exportacao-csv"
      aria-labelledby="relatorio-export-title"
    >
      <div className="relatorio-hub-export__header">
        <div>
          <h2 className="relatorio-hub-export__title" id="relatorio-export-title">
            {RELATORIOS_COPY.exportSectionTitle}
          </h2>
          <p className="relatorio-hub-export__lead">{RELATORIOS_COPY.exportHubSectionLead}</p>
        </div>
        <span className="relatorio-hub-export__badge">
          <i className="bi bi-file-earmark-spreadsheet" aria-hidden="true" /> CSV
        </span>
      </div>
      <RelatoriosPanel />
    </section>
  );
}
