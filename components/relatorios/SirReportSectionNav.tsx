"use client";

import { ReportSectionNav } from "@/components/relatorios/ReportSectionNav";

const SECTIONS = [
  { id: "sir-resumo", label: "Resumo" },
  { id: "sir-graficos", label: "Gráficos" },
  { id: "sir-drilldown", label: "Detalhe" },
  { id: "sir-concluidos", label: "Concluídos" },
] as const;

/** Atalhos para saltar entre seções do relatório SIR. */
export function SirReportSectionNav() {
  return <ReportSectionNav sections={SECTIONS} ariaLabel="Seções do relatório SIR" />;
}
