/** Tamanho padrão de página da listagem TX. */
export const TX_LIST_PAGE_SIZE = 50;

/** Limite máximo aceito pela API TX. */
export const TX_LIST_MAX_PAGE_SIZE = 200;

/** Normaliza número de página TX (mínimo 1). */
export function txPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Normaliza limite TX com default 50 e teto 200. */
export function txLimitFromParam(param?: string | null): number {
  const limit = Number(param);
  if (!Number.isFinite(limit) || limit < 1) return TX_LIST_PAGE_SIZE;
  return Math.min(Math.floor(limit), TX_LIST_MAX_PAGE_SIZE);
}

/** Calcula offset SQL para a página TX. */
export function txListOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/** Total de páginas para um conjunto paginado TX. */
export function txTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

/** Rótulo "início–fim de total" para listagens paginadas TX. */
export function txListRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems <= 0) return "Nenhum registro";
  const start = txListOffset(page, pageSize) + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} de ${totalItems}`;
}
