/** Comprimento máximo do termo de busca na URL (`q`). */
export const TABLE_SEARCH_MAX_LENGTH = 80;

/** Normaliza termo de busca da query string (trim + limite). */
export function normalizeTableSearch(param?: string | null): string | undefined {
  if (!param) return undefined;
  try {
    const decoded = decodeURIComponent(param).trim();
    if (!decoded) return undefined;
    return decoded.slice(0, TABLE_SEARCH_MAX_LENGTH);
  } catch {
    const trimmed = param.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, TABLE_SEARCH_MAX_LENGTH);
  }
}

/** Escapa `%`, `_` e `!` para uso seguro em LIKE com ESCAPE '!'. */
export function escapeLikePattern(term: string): string {
  return term.replace(/[!%_]/g, (char) => `!${char}`);
}

/** Monta padrão LIKE com curingas e escape de metacaracteres. */
export function likeContainsPattern(term: string): string {
  return `%${escapeLikePattern(term)}%`;
}
