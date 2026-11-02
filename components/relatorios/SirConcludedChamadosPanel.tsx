import Link from "next/link";
import { SirConcludedChamadosTable } from "@/components/relatorios/SirConcludedChamadosTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { buildSirReportHref } from "@/lib/config/sir-report-filters";
import type {
  SirConcludedChamadoRow,
  SirReportFilters,
  SirReportKpiScopeKey,
} from "@/lib/models/sir-report";

type SirConcludedChamadosPanelProps = {
  filters: SirReportFilters;
  rows: SirConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
  escopo?: SirReportKpiScopeKey;
};

/** Listagem paginada de chamados SIR concluídos no relatório. */
export function SirConcludedChamadosPanel({
  filters,
  rows,
  total,
  page,
  pageSize,
  escopo,
}: SirConcludedChamadosPanelProps) {
  return (
    <div id="sir-concluidos" className="sir-concluidos-panel mb-4 mt-4">
      {escopo ? (
        <div className="sir-concluidos-filter">
          <span className="sir-concluidos-filter__chip">Escopo: {escopo}</span>
          <Link
            href={`${buildSirReportHref(filters)}#sir-concluidos`}
            className="sir-concluidos-filter__clear"
            scroll={false}
          >
            Limpar filtro
          </Link>
        </div>
      ) : null}
      <SirConcludedChamadosTable rows={rows} total={total} />
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(nextPage) =>
          buildSirReportHref(filters, {
            concluidosPage: nextPage,
            concluidosEscopo: escopo,
          })
        }
      />
    </div>
  );
}
