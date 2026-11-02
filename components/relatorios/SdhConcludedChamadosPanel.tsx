import { SdhConcludedChamadosTable } from "@/components/relatorios/SdhConcludedChamadosTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildSdhReportHref } from "@/lib/config/sdh-report-filters";
import type { SdhConcludedChamadoRow, SdhReportFilters } from "@/lib/models/sdh-report";

type SdhConcludedChamadosPanelProps = {
  filters: SdhReportFilters;
  rows: SdhConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** Listagem paginada de encerramentos SDH no relatório. */
export function SdhConcludedChamadosPanel({
  filters,
  rows,
  total,
  page,
  pageSize,
}: SdhConcludedChamadosPanelProps) {
  return (
    <div id="sdh-concluidos" className="sir-concluidos-panel mb-4 mt-4">
      <SdhConcludedChamadosTable rows={rows} total={total} />
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(nextPage) =>
          buildSdhReportHref(filters, {
            concluidosPage: nextPage,
          })
        }
      />
    </div>
  );
}
