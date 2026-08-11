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

/**
 * Href para `fetch` / `window.location` atrás do Nginx.
 * Não duplica o prefixo se `path` já começar com o basePath.
 */
export function appHref(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return withBasePath("/");
  }
  if (
    APP_BASE_PATH &&
    (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`))
  ) {
    return path;
  }
  return withBasePath(path);
}

/** `fetch` com path absoluto respeitando `basePath`. */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(appHref(input), init);
}
