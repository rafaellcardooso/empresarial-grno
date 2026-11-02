"use client";

import { ReportSectionNav } from "@/components/relatorios/ReportSectionNav";

const SECTIONS = [
  { id: "sdh-resumo", label: "Resumo" },
  { id: "sdh-graficos", label: "Gráficos" },
  { id: "sdh-drilldown", label: "Detalhe" },
  { id: "sdh-concluidos", label: "Encerrados" },
] as const;

/** Atalhos para saltar entre seções do relatório SDH. */
export function SdhReportSectionNav() {
  return <ReportSectionNav sections={SECTIONS} ariaLabel="Seções do relatório SDH" />;
}
