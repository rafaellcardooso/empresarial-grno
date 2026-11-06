import { RelatorioBsodExportForm } from "@/components/relatorios/RelatorioBsodExportForm";
import { RelatorioSirExportForm } from "@/components/relatorios/RelatorioSirExportForm";
import { RelatorioTxExportForm } from "@/components/relatorios/RelatorioTxExportForm";

/** Painel com exportações CSV de SIR, BSOD e TX. */
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
      <div className="col-12">
        <RelatorioTxExportForm />
      </div>
    </div>
  );
}
