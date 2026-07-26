/** Tamanho padrão de página na listagem BSOD. */
export const BSOD_LIST_PAGE_SIZE = 50;

/** Limite máximo de registros por página na UI. */
export const BSOD_LIST_MAX_PAGE_SIZE = 200;

/** Tamanho do lote SQL na exportação CSV BSOD (paginação interna). */
export const BSOD_EXPORT_BATCH_SIZE = 2000;

/** Alias legado — preferir BSOD_EXPORT_BATCH_SIZE. */
export const BSOD_EXPORT_MAX_ROWS = BSOD_EXPORT_BATCH_SIZE;

/** Normaliza número de página a partir da query string (mínimo 1). */
export function bsodPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Calcula offset SQL a partir de página e limite. */
export function bsodListOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
