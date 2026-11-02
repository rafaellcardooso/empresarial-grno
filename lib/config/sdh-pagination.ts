/** Tamanho padrão de página da listagem SDH. */
export const SDH_LIST_PAGE_SIZE = 50;

/** Limite máximo aceito pela API SDH. */
export const SDH_LIST_MAX_PAGE_SIZE = 200;

/** Normaliza número de página SDH (mínimo 1). */
export function sdhPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Normaliza limite SDH com default 50 e teto 200. */
export function sdhLimitFromParam(param?: string | null): number {
  const limit = Number(param);
  if (!Number.isFinite(limit) || limit < 1) return SDH_LIST_PAGE_SIZE;
  return Math.min(Math.floor(limit), SDH_LIST_MAX_PAGE_SIZE);
}

/** Calcula offset SQL para a página SDH. */
export function sdhListOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/** Total de páginas para um conjunto paginado SDH. */
export function sdhTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

/** Rótulo "início–fim de total" para listagens paginadas SDH. */
export function sdhListRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems <= 0) return "Nenhum registro";
  const start = sdhListOffset(page, pageSize) + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} de ${totalItems}`;
}
