import Link from "next/link";
import { TratativaChamadosTable } from "@/components/relatorios/TratativaChamadosTable";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  TRATATIVA_CHAMADO_STATUS_LABELS,
  TRATATIVA_CHAMADO_STATUS_ORDER,
  type TratativaChamadoStatusFilter,
} from "@/lib/config/tratativa-chamados";
import { buildTratativaReportHref } from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { TratativaChamadoRow, TratativaReportFilters } from "@/lib/models/tratativa-report";

type TratativaChamadosPanelProps = {
  filters: TratativaReportFilters;
  rows: TratativaChamadoRow[];
  counts: Record<TratativaChamadoStatusFilter, number>;
  total: number;
  page: number;
  pageSize: number;
};

/** Painel de listagem de chamados com chips de status e paginação. */
export function TratativaChamadosPanel({
  filters,
  rows,
  counts,
  total,
  page,
  pageSize,
}: TratativaChamadosPanelProps) {
  const activeStatus = filters.status ?? "all";

  function statusHref(status: TratativaChamadoStatusFilter): string {
    return buildTratativaReportHref({
      ...filters,
      status,
      page: 1,
    });
  }

  return (
    <div className="tratativa-chamados-panel mb-4">
      <div className="sir-filter-toolbar__group mb-3">
        <span className="sir-filter-toolbar__heading">{RELATORIOS_COPY.statusLabel}</span>
        <div className="sir-filter-toolbar__chips">
          <Link
            href={statusHref("all")}
            className={`sir-filter-chip${activeStatus === "all" ? " is-active" : ""}`}
            scroll={false}
          >
            {RELATORIOS_COPY.chamadosStatusAll}
            <span className="sir-filter-chip__count">{counts.all}</span>
          </Link>
          {TRATATIVA_CHAMADO_STATUS_ORDER.map((status) => (
            <Link
              key={status}
              href={statusHref(status)}
              className={`sir-filter-chip${activeStatus === status ? " is-active" : ""}`}
              scroll={false}
            >
              {TRATATIVA_CHAMADO_STATUS_LABELS[status]}
              <span className="sir-filter-chip__count">{counts[status]}</span>
            </Link>
          ))}
        </div>
      </div>

      <TratativaChamadosTable rows={rows} total={total} />
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        buildPageHref={(nextPage) =>
          buildTratativaReportHref({
            ...filters,
            page: nextPage,
          })
        }
      />
    </div>
  );
}
