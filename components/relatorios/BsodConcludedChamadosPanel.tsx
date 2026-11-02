import { BsodConcludedChamadosTable } from "@/components/relatorios/BsodConcludedChamadosTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildTratativaReportHref } from "@/lib/config/relatorios-filters";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";
import type { BsodConcludedChamadoRow } from "@/lib/queries/bsod-concluded-chamados";

type BsodConcludedChamadosPanelProps = {
  filters: TratativaReportFilters;
  rows: BsodConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** Listagem paginada de encerramentos BSOD no relatório. */
export function BsodConcludedChamadosPanel({
  filters,
  rows,
  total,
  page,
  pageSize,
}: BsodConcludedChamadosPanelProps) {
  return (
    <div id="bsod-concluidos" className="sir-concluidos-panel mb-4 mt-4">
      <BsodConcludedChamadosTable rows={rows} total={total} />
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(nextPage) =>
          buildTratativaReportHref({
            ...filters,
            status: "concluido",
            page: nextPage,
          })
        }
      />
    </div>
  );
}
