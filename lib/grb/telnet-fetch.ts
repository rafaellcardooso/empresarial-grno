const GRB_FETCH_TIMEOUT_MS = 120_000;

const GRB_TELNET_AUTH_HINT =
  "Configure GRB_TELNET_USERNAME e GRB_TELNET_PASSWORD em .env.local (mesmas chaves do botGrb).";

/** Indica se Basic Auth telnet GRB está configurado no ambiente. */
export function isGrbTelnetAuthConfigured(): boolean {
  return Boolean(process.env.GRB_TELNET_USERNAME?.trim());
}

/** Falha cedo quando credenciais telnet GRB não estão no ambiente. */
export function assertGrbTelnetAuthConfigured(): void {
  if (!isGrbTelnetAuthConfigured()) {
    throw new Error(GRB_TELNET_AUTH_HINT);
  }
}

/** Monta header Authorization Basic quando GRB_TELNET_* estão definidos. */
export function getGrbTelnetAuthHeader(): Record<string, string> {
  const username = process.env.GRB_TELNET_USERNAME?.trim();
  const password = process.env.GRB_TELNET_PASSWORD ?? "";
  if (!username) return {};

  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

/** Enriquece erro de permissão do GRB com dica de configuração de env. */
export function enrichGrbTelnetPermissionError(message: string): string {
  if (!/permiss/i.test(message)) return message;
  if (isGrbTelnetAuthConfigured()) return message;
  return `${message} ${GRB_TELNET_AUTH_HINT}`;
}

/** Baixa texto do GRB telnet com timeout e auth opcional. */
export async function fetchGrbTelnetText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GRB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: getGrbTelnetAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`GRB respondeu HTTP ${response.status}.`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}
