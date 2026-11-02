import type { CsvColumn } from "@/lib/export/csv";
import type { SirReportData, SirReportFilters } from "@/lib/models/sir-report";

export const SIR_REPORT_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { key: "secao", label: "SEÇÃO" },
  { key: "dominio", label: "DOMÍNIO" },
  { key: "chave", label: "CHAVE" },
  { key: "rotulo", label: "RÓTULO" },
  { key: "total", label: "TOTAL" },
];

/** Flatten do relatório para exportação CSV gerencial. */
export function sirReportRowsForExport(data: SirReportData): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const push = (secao: string, dominio: string, chave: string, rotulo: string, total: number) => {
    rows.push({ secao, dominio, chave, rotulo, total });
  };

  for (const scope of data.summary.scopes) {
    push("backlog", scope.key, "total_ativo", "Ativos", scope.totalActive);
    push("backlog", scope.key, "pendente", "Pendentes", scope.pending);
    push("backlog", scope.key, "em_tratativa", "Em tratativa", scope.inTreatment);
    push("aberturas", scope.key, "periodo", "Aberturas no período", scope.openingsInPeriod);
    push("conclusoes", scope.key, "periodo", "Conclusões no período", scope.conclusionsInPeriod);
  }

  for (const bucket of data.ageBuckets) {
    push("idade", bucket.domain, bucket.key, bucket.label, bucket.total);
  }
  for (const row of data.byCf) {
    push("cf", row.domain, row.key, row.label, row.total);
  }
  for (const row of data.byTipo) {
    push("tipo", row.domain, row.key, row.label, row.total);
  }
  for (const row of data.byDdd) {
    push("ddd", row.domain, row.key, row.label, row.total);
  }
  for (const point of data.dailyOpenings) {
    push("aberturas_dia", "RAL", point.date, point.date, point.ral);
    push("aberturas_dia", "REC", point.date, point.date, point.rec);
  }
  for (const point of data.dailyConclusions) {
    push("conclusoes_dia", "RAL", point.date, point.date, point.ral);
    push("conclusoes_dia", "REC", point.date, point.date, point.rec);
  }

  return rows;
}

/** Nome descritivo do arquivo CSV do relatório SIR. */
export function sirReportExportBasename(filters: SirReportFilters): string {
  return `sir-relatorio-${filters.domain}`;
}
