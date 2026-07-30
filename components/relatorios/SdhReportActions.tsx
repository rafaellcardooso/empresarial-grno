"use client";

import Link from "next/link";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

type SdhReportActionsProps = {
  monitorHref: string;
  exportHref: string;
  periodLabel: string;
};

/** Ações do cabeçalho do relatório SDH (exportação e link operacional). */
export function SdhReportActions({ monitorHref, exportHref, periodLabel }: SdhReportActionsProps) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <span className="relatorio-dashboard__period-badge">{periodLabel}</span>
      <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.sdhExportCsv} variant="header" />
      <Link href={monitorHref} className="btn btn-outline-primary btn-sm">
        {RELATORIOS_COPY.sdhOpenMonitor}
      </Link>
    </div>
  );
}
