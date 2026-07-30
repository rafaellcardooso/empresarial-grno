"use client";

import Link from "next/link";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

type SirReportActionsProps = {
  monitorHref: string;
  exportHref: string;
  periodLabel: string;
};

/** Ações do cabeçalho do relatório SIR. */
export function SirReportActions({ monitorHref, exportHref, periodLabel }: SirReportActionsProps) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <span className="relatorio-dashboard__period-badge">{periodLabel}</span>
      <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.sirExportCsv} variant="header" />
      <Link href={monitorHref} className="btn btn-outline-primary btn-sm">
        {RELATORIOS_COPY.sirOpenMonitor}
      </Link>
    </div>
  );
}
