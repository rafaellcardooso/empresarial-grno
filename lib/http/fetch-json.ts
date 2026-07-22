/** Resultado tipado de fetch JSON com tratamento de erro. */
export type FetchJsonResult<T> =
  { ok: true; data: T; status: number } | { ok: false; error: string; status: number };

const DEFAULT_ERROR = "Não foi possível concluir a operação.";
const NETWORK_ERROR = "Erro de conexão. Tente novamente.";

/** Executa fetch, parseia JSON e normaliza erros de API/rede. */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  try {
    const response = await fetch(input, init);
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };

    if (!response.ok) {
      return {
        ok: false,
        error: data.error ?? DEFAULT_ERROR,
        status: response.status,
      };
    }

    return { ok: true, data, status: response.status };
  } catch {
    return { ok: false, error: NETWORK_ERROR, status: 0 };
  }
}
