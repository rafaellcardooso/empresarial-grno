/** Extrai texto de bloco pre quando presente no fragmento GRB. */
function extractPreText(fragment: string): string {
  const preMatch = fragment.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  return preMatch?.[1] ?? fragment;
}

/** Decodifica trecho HTML retornado pelo GRB para texto de terminal. */
function decodeGrbHtmlFragment(fragment: string): string {
  const raw = extractPreText(fragment);

  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** Extrai innerHTML atribuído a div_resultado em respostas script do proxy GRB. */
function extractDivResultadoInnerHtml(body: string): string | null {
  const patterns = [
    /getElementById\s*\(\s*['"]div_resultado['"]\s*\)\.innerHTML\s*\+=\s*"((?:\\.|[^"\\])*)"/gi,
    /getElementById\s*\(\s*['"]div_resultado['"]\s*\)\.innerHTML\s*=\s*"((?:\\.|[^"\\])*)"/gi,
    /getElementById\s*\(\s*['"]div_resultado['"]\s*\)\.innerHTML\s*\+=\s*'((?:\\.|[^'\\])*)'/gi,
    /getElementById\s*\(\s*['"]div_resultado['"]\s*\)\.innerHTML\s*=\s*'((?:\\.|[^'\\])*)'/gi,
  ];

  const chunks: string[] = [];

  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      if (match[1]) {
        const decoded = decodeGrbHtmlFragment(match[1]);
        if (decoded) chunks.push(decoded);
      }
    }
  }

  if (chunks.length === 0) return null;

  return chunks.join("\n").trim();
}

/** Remove tags HTML e normaliza espaços em resposta fallback. */
function stripHtmlBody(body: string): string {
  const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  const text = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");

  return text.trim();
}

/** Obtém saída telnet a partir do HTML/JS retornado pelo proxy GRB. */
export function parseGrbProxyResponse(body: string): string {
  const fromScript = extractDivResultadoInnerHtml(body);
  if (fromScript) return fromScript;

  const stripped = stripHtmlBody(body);
  if (stripped) return stripped;

  return "Resposta vazia do GRB.";
}
