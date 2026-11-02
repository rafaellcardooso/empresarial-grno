"use client";

import { ReportSectionNav } from "@/components/relatorios/ReportSectionNav";

const SECTIONS = [
  { id: "bsod-resumo", label: "Resumo" },
  { id: "bsod-graficos", label: "Gráficos" },
  { id: "bsod-concluidos", label: "Encerrados" },
] as const;

/** Atalhos para saltar entre seções do relatório BSOD. */
export function TratativaReportSectionNav() {
  return <ReportSectionNav sections={SECTIONS} ariaLabel="Seções do relatório BSOD" />;
}
