import { RelatorioBsodExportForm } from "@/components/relatorios/RelatorioBsodExportForm";
import { RelatorioSirExportForm } from "@/components/relatorios/RelatorioSirExportForm";

/** Painel com exportações CSV de SIR e BSOD. */
export function RelatoriosPanel() {
  return (
    <div className="row g-3">
      <div className="col-lg-6">
        <RelatorioSirExportForm scope="ral" />
      </div>
      <div className="col-lg-6">
        <RelatorioSirExportForm scope="rec" />
      </div>
      <div className="col-12">
        <RelatorioBsodExportForm />
      </div>
    </div>
  );
}
