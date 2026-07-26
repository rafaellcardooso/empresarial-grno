import type { CritelSearchMatch } from "@/lib/config/critel";

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

/** Extrai matches de hierarquia a partir do HTML de proc/pesquisa.php. */
export function parseCritelPesquisaHtml(html: string): CritelSearchMatch[] {
  const rows = html.split('<tr class="tr_resultado_pesquisa">').slice(1);
  const matches: CritelSearchMatch[] = [];

  for (const row of rows) {
    const valueMatch = row.match(/name="hierarquia\[\]"[^>]*value="([^"]+)"/);
    const titleMatch = row.match(/class="td_resultado_pesquisa"[^>]*title="([^"]*)"/);
    const labelMatch = row.match(/<span class="link_resultado">([^<]+)<\/span>/);

    if (!valueMatch?.[1] || !labelMatch?.[1]) continue;

    matches.push({
      hierarquia: decodeHtmlEntities(valueMatch[1]),
      designacao: decodeHtmlEntities(labelMatch[1].trim()),
      description: decodeHtmlEntities(titleMatch?.[1]?.trim() ?? ""),
    });
  }

  return matches;
}
