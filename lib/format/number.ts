/** Formata número com locale pt-BR (consistente entre SSR e browser). */
export function formatNumberPtBr(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("pt-BR", options).format(value);
}
