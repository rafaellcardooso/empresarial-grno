/** Tamanho padrão da listagem de encerramentos no relatório SDH. */
export const SDH_CONCLUDED_PAGE_SIZE = 50;

/** Limite máximo por página na listagem de encerramentos. */
export const SDH_CONCLUDED_MAX_PAGE_SIZE = 200;

/** Normaliza número de página a partir da query string (mínimo 1). */
export function sdhConcludedPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Calcula offset SQL a partir de página e tamanho. */
export function sdhConcludedOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
