/** Tamanho padrão de página nas listagens SIR (RAL/REC). */
export const SIR_LIST_PAGE_SIZE = 50;

/** Limite máximo de registros por página (UI e API). */
export const SIR_LIST_MAX_PAGE_SIZE = 200;

/** Normaliza número de página a partir da query string (mínimo 1). */
export function sirPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Normaliza limite por página (default SIR_LIST_PAGE_SIZE, cap SIR_LIST_MAX_PAGE_SIZE). */
export function sirLimitFromParam(param?: string | null): number {
  if (param == null || param === "") return SIR_LIST_PAGE_SIZE;
  const limit = Number(param);
  if (!Number.isFinite(limit) || limit < 1) return SIR_LIST_PAGE_SIZE;
  return Math.min(Math.floor(limit), SIR_LIST_MAX_PAGE_SIZE);
}

/** Calcula offset SQL a partir de página e limite. */
export function sirListOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/** Total de páginas para um conjunto paginado. */
export function sirTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

/** Rótulo "início–fim de total" para listagens paginadas. */
export function sirListRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems <= 0) return "Nenhum registro";
  const start = sirListOffset(page, pageSize) + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} de ${totalItems}`;
}
