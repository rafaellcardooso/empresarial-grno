/** Prefixo público Next (`basePath`); vazio se a app roda na raiz. */
export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/$/,
  "",
);

/** Prefixa path absoluto com o basePath da aplicação (CSS, JS e Image). */
export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!APP_BASE_PATH) {
    return normalized;
  }
  return `${APP_BASE_PATH}${normalized}`;
}
