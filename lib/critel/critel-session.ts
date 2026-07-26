const CRITEL_FETCH_TIMEOUT_MS = 120_000;

type CritelFetchInit = RequestInit & {
  timeoutMs?: number;
};

/** Mantém cookie PHPSESSID entre chamadas ao portal Critel. */
export class CritelSession {
  private cookies = new Map<string, string>();

  /** Executa fetch com cookies acumulados e atualiza jar a partir de Set-Cookie. */
  async fetch(url: string, init: CritelFetchInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = init.timeoutMs ?? CRITEL_FETCH_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(init.headers);
    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        cache: "no-store",
        signal: controller.signal,
      });

      this.storeSetCookies(response);
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildCookieHeader(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  private storeSetCookies(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];

    for (const entry of setCookies) {
      const [pair] = entry.split(";");
      const separator = pair.indexOf("=");
      if (separator === -1) continue;

      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (name) {
        this.cookies.set(name, value);
      }
    }
  }
}
