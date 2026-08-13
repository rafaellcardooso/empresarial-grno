type ListPaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Monta rótulo "início–fim de total" para listagens paginadas. */
function listRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems <= 0) return "Nenhum registro";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} de ${totalItems}`;
}

/** Controles client-side de paginação (Anterior/Próxima). */
export function ListPagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  disabled = false,
  ariaLabel = "Paginação da lista",
}: ListPaginationProps) {
  if (totalItems <= 0) {
    return null;
  }

  const rangeLabel = listRangeLabel(currentPage, pageSize, totalItems);
  const showNav = totalItems > pageSize;

  if (!showNav) {
    return (
      <p className="notification-history-pagination__range text-body-secondary small mb-0">
        {rangeLabel}
      </p>
    );
  }

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="notification-history-pagination">
      <p className="notification-history-pagination__range text-body-secondary small mb-0">
        {rangeLabel}
      </p>
      <nav aria-label={ariaLabel}>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item${currentPage <= 1 || disabled ? " disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              disabled={currentPage <= 1 || disabled}
              onClick={() => onPageChange(prevPage)}
            >
              Anterior
            </button>
          </li>
          <li className="page-item disabled">
            <span className="page-link">
              Página {currentPage} de {totalPages}
            </span>
          </li>
          <li className={`page-item${currentPage >= totalPages || disabled ? " disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              disabled={currentPage >= totalPages || disabled}
              onClick={() => onPageChange(nextPage)}
            >
              Próxima
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
