import {
  buildCritelDesignacaoContainsQuery,
  buildCritelDesignacaoQuery,
  getCritelGraphTypeLabel,
  getCritelRangeLabel,
  normalizeCritelDesignacao,
  type CritelGraphData,
  type CritelGraphKind,
  type CritelGraphSummaryEntry,
  type CritelSearchMatch,
} from "@/lib/config/critel";
import { CritelSession } from "@/lib/critel/critel-session";
import { parseCritelPesquisaHtml } from "@/lib/critel/parse-pesquisa-html";

type CritelStandaloneGraphResponse = {
  xportData?: boolean;
  summary?: Array<[string, string]>;
  datainicio?: string;
  datafim?: string;
  lastUpdate?: string;
  url?: string;
  message?: string;
  error?: string;
};

export type CritelFetchGraphInput = {
  baseUrl: string;
  designacao: string;
  hierarquia?: string;
  grafico?: number;
  range?: string;
  graphKind?: CritelGraphKind;
};

export type CritelFetchGraphResult =
  | {
      status: "graph";
      data: CritelGraphData;
    }
  | {
      status: "matches";
      query: string;
      matches: CritelSearchMatch[];
    };

type CritelSearchParams = {
  query: string;
  grafico: number;
  range: string;
  graphKind: CritelGraphKind;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function buildSearchFormBody(params: CritelSearchParams): URLSearchParams {
  const body = new URLSearchParams();
  body.set("submitted", "1");
  body.set("query", params.query);
  body.set("cliente", "1");
  body.set("backbone", "1");
  body.set("grafico", String(params.grafico));
  body.set("exibir", "designacao");
  body.set("agrupar", "nao");
  body.set("range", params.range);
  body.set("tipo", params.graphKind);
  return body;
}

function buildGraphFormBody(params: CritelSearchParams, hierarquia: string): URLSearchParams {
  const body = buildSearchFormBody(params);
  body.set("hierarquia", hierarquia);
  body.set("standalone", "1");
  return body;
}

function parseSummary(summary: Array<[string, string]> | undefined): CritelGraphSummaryEntry[] {
  if (!summary) return [];

  return summary.map(([key, value]) => ({ key, value }));
}

function pickMatch(
  matches: CritelSearchMatch[],
  designacao: string,
  hierarquia?: string,
): CritelSearchMatch | null {
  if (hierarquia) {
    return matches.find((match) => match.hierarquia === hierarquia) ?? null;
  }

  const normalizedDesignacao = designacao.trim().toUpperCase();
  const exactMatches = matches.filter(
    (match) => match.designacao.trim().toUpperCase() === normalizedDesignacao,
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

async function searchCritelMatches(
  session: CritelSession,
  baseUrl: string,
  params: CritelSearchParams,
): Promise<{ query: string; matches: CritelSearchMatch[] }> {
  const exactQuery = buildCritelDesignacaoQuery(params.query.replace(/^designacao\s*:=\s*/i, ""));
  const exactBody = buildSearchFormBody({ ...params, query: exactQuery });
  const exactResponse = await session.fetch(`${baseUrl}/proc/pesquisa.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: exactBody.toString(),
  });

  if (!exactResponse.ok) {
    throw new Error(`Critel respondeu HTTP ${exactResponse.status} na pesquisa.`);
  }

  const exactHtml = await exactResponse.text();
  const exactMatches = parseCritelPesquisaHtml(exactHtml);
  if (exactMatches.length > 0) {
    return { query: exactQuery, matches: exactMatches };
  }

  const containsQuery = buildCritelDesignacaoContainsQuery(
    params.query.replace(/^designacao\s*:\s*/i, ""),
  );
  const containsBody = buildSearchFormBody({ ...params, query: containsQuery });
  const containsResponse = await session.fetch(`${baseUrl}/proc/pesquisa.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containsBody.toString(),
  });

  if (!containsResponse.ok) {
    throw new Error(`Critel respondeu HTTP ${containsResponse.status} na pesquisa.`);
  }

  const containsHtml = await containsResponse.text();
  return {
    query: containsQuery,
    matches: parseCritelPesquisaHtml(containsHtml),
  };
}

/** Pesquisa designação no Critel e obtém PNG do gráfico via proc/graficos.php. */
export async function fetchCritelGraph(
  input: CritelFetchGraphInput,
): Promise<CritelFetchGraphResult> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const designacao = normalizeCritelDesignacao(input.designacao);
  if (!designacao) {
    throw new Error("Designação é obrigatória.");
  }

  const grafico = input.grafico ?? 0;
  const range = input.range ?? "2";
  const graphKind = input.graphKind ?? "medias";
  const session = new CritelSession();

  const searchParams: CritelSearchParams = {
    query: designacao,
    grafico,
    range,
    graphKind,
  };

  const { query, matches } = await searchCritelMatches(session, baseUrl, searchParams);
  if (matches.length === 0) {
    throw new Error(`Nenhum circuito encontrado para a designação informada (${query}).`);
  }

  const selected = pickMatch(matches, designacao, input.hierarquia);
  if (!selected) {
    return { status: "matches", query, matches };
  }

  const graphBody = buildGraphFormBody(searchParams, selected.hierarquia);
  const graphResponse = await session.fetch(`${baseUrl}/proc/graficos.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: graphBody.toString(),
  });

  if (!graphResponse.ok) {
    throw new Error(`Critel respondeu HTTP ${graphResponse.status} ao gerar gráfico.`);
  }

  let payload: CritelStandaloneGraphResponse;
  try {
    payload = (await graphResponse.json()) as CritelStandaloneGraphResponse;
  } catch {
    throw new Error("Resposta inválida do Critel ao gerar gráfico.");
  }

  if (payload.message || payload.error) {
    throw new Error(payload.message ?? payload.error ?? "Critel não gerou o gráfico.");
  }

  if (!payload.url) {
    throw new Error("Critel não retornou URL do gráfico.");
  }

  const graphUrl = payload.url.startsWith("http")
    ? payload.url
    : `${baseUrl}/${payload.url.replace(/^\//, "")}`;

  const imageResponse = await session.fetch(graphUrl, { method: "GET" });
  if (!imageResponse.ok) {
    throw new Error(`Critel respondeu HTTP ${imageResponse.status} na imagem do gráfico.`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const imageContentType = imageResponse.headers.get("content-type") ?? "image/png";

  return {
    status: "graph",
    data: {
      designacao: selected.designacao,
      description: selected.description,
      hierarquia: selected.hierarquia,
      graphType: getCritelGraphTypeLabel(grafico),
      rangeLabel: getCritelRangeLabel(range),
      graphKind,
      datainicio: payload.datainicio ?? "",
      datafim: payload.datafim ?? "",
      lastUpdate: payload.lastUpdate ?? "",
      summary: parseSummary(payload.summary),
      imageBase64: imageBuffer.toString("base64"),
      imageContentType,
    },
  };
}
