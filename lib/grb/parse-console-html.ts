export type GrbProxyTokens = {
  arg0: string;
  arg1?: string;
  arg2?: string;
};

/** Extrai mensagem de erro do bloco divMsg do GRB, se presente. */
export function extractGrbPageError(html: string): string | null {
  const match = html.match(/id=["']divMsg["'][^>]*>[\s\S]*?<big>([\s\S]*?)<\/big>/i);
  if (!match?.[1]) return null;

  let text = match[1].replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  text = text.replace(/\s+/g, " ").trim();
  return text || null;
}

/** Extrai tokens arg0–arg2 do bloco submit_enviar no HTML do console GRB. */
export function extractGrbProxyTokens(html: string): GrbProxyTokens | null {
  const arg0Match = html.match(/url\s*\+=\s*"&arg0=([^"]+)"/i);
  if (!arg0Match?.[1]) return null;

  const arg1Match = html.match(/url\s*\+=\s*"&arg1=([^"]+)"/i);
  const arg2Match = html.match(/url\s*\+=\s*"&arg2=([^"]+)"/i);

  return {
    arg0: arg0Match[1],
    arg1: arg1Match?.[1],
    arg2: arg2Match?.[1],
  };
}

/** Monta URL do executar_comandos_telnet_proxy.php com tokens já codificados no HTML. */
export function buildGrbProxyUrl(
  baseUrl: string,
  tokens: GrbProxyTokens,
  idRede: number,
  comando: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const parts = [`${base}/executar_comandos_telnet_proxy.php?`, `&arg0=${tokens.arg0}`];

  if (tokens.arg1) parts.push(`&arg1=${tokens.arg1}`);
  if (tokens.arg2) parts.push(`&arg2=${tokens.arg2}`);

  parts.push(`&id_rede=${idRede}`);
  parts.push(`&comando=${encodeURIComponent(comando)}`);
  parts.push(`&tcos=${Date.now()}`);

  return parts.join("");
}

/** Extrai valores do select interface_s do HTML do console GRB (sem duplicatas). */
export function extractGrbInterfaceOptions(html: string): string[] {
  const selectMatch = html.match(/<select[^>]*id=['"]interface_s['"][^>]*>([\s\S]*?)<\/select>/i);
  if (!selectMatch?.[1]) return [];

  const seen = new Set<string>();
  const options: string[] = [];
  const optionPattern = /<option\s+value=['"]([^'"]*)['"]\s*>/gi;

  for (const match of selectMatch[1].matchAll(optionPattern)) {
    const value = match[1]?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push(value);
  }

  return options;
}
