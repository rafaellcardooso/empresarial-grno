import Link from "next/link";
import { sirListRangeLabel, sirTotalPages } from "@/lib/config/sir-pagination";

type TablePaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  buildPageHref: (page: number) => string;
};

/** Controles de paginação com intervalo visível e links anterior/próxima. */
export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  buildPageHref,
}: TablePaginationProps) {
  const totalPages = sirTotalPages(totalItems, pageSize);

  if (totalItems <= pageSize) {
    return (
      <p className="text-body-secondary small mb-0 px-3 py-2 border-top">
        {sirListRangeLabel(currentPage, pageSize, totalItems)}
      </p>
    );
  }

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 px-3 py-2 border-top">
      <p className="text-body-secondary small mb-0">
        {sirListRangeLabel(currentPage, pageSize, totalItems)}
      </p>
      <nav aria-label="Paginação da tabela">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item${currentPage <= 1 ? " disabled" : ""}`}>
            {currentPage <= 1 ? (
              <span className="page-link">Anterior</span>
            ) : (
              <Link className="page-link" href={buildPageHref(prevPage)} scroll={false}>
                Anterior
              </Link>
            )}
          </li>
          <li className="page-item disabled">
            <span className="page-link">
              Página {currentPage} de {totalPages}
            </span>
          </li>
          <li className={`page-item${currentPage >= totalPages ? " disabled" : ""}`}>
            {currentPage >= totalPages ? (
              <span className="page-link">Próxima</span>
            ) : (
              <Link className="page-link" href={buildPageHref(nextPage)} scroll={false}>
                Próxima
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
