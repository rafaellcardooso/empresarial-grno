/** Tamanho padrão da listagem de chamados no relatório BSOD. */
export const TRATATIVA_CHAMADOS_PAGE_SIZE = 50;

/** Limite máximo por página na listagem de chamados. */
export const TRATATIVA_CHAMADOS_MAX_PAGE_SIZE = 200;

/** Normaliza número de página a partir da query string (mínimo 1). */
export function tratativaChamadosPageFromParam(param?: string | null): number {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Calcula offset SQL/memória a partir de página e tamanho. */
export function tratativaChamadosOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
