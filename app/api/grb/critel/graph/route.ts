import { NextResponse } from "next/server";
import {
  CRITEL_DEFAULT_GRAPH_KIND,
  CRITEL_DEFAULT_GRAPH_TYPE,
  CRITEL_DEFAULT_RANGE,
  normalizeCritelDesignacao,
  type CritelGraphKind,
} from "@/lib/config/critel";
import { fetchCritelGraph } from "@/lib/critel/fetch-graph";

type CritelGraphBody = {
  designacao?: string;
  hierarquia?: string;
  grafico?: number;
  range?: string;
  graphKind?: CritelGraphKind;
};

function parseGraphKind(value: unknown): CritelGraphKind {
  return value === "picos" ? "picos" : CRITEL_DEFAULT_GRAPH_KIND;
}

/** Consulta Critel por designação e devolve gráfico ou lista de matches ambíguos. */
export async function POST(request: Request) {
  const critelBaseUrl = process.env.CRITEL_BASE_URL?.trim();
  if (!critelBaseUrl) {
    return NextResponse.json({ error: "Critel não configurado." }, { status: 503 });
  }

  let body: CritelGraphBody;
  try {
    body = (await request.json()) as CritelGraphBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const designacao = normalizeCritelDesignacao(body.designacao ?? "");
  if (!designacao) {
    return NextResponse.json({ error: "Designação é obrigatória." }, { status: 400 });
  }

  const grafico = Number(body.grafico);
  const range = body.range?.trim() || CRITEL_DEFAULT_RANGE;
  const graphKind = parseGraphKind(body.graphKind);
  const hierarquia = body.hierarquia?.trim();

  try {
    const result = await fetchCritelGraph({
      baseUrl: critelBaseUrl,
      designacao,
      hierarquia,
      grafico: Number.isFinite(grafico) ? grafico : CRITEL_DEFAULT_GRAPH_TYPE,
      range,
      graphKind,
    });

    if (result.status === "matches") {
      return NextResponse.json({
        status: "matches",
        query: result.query,
        matches: result.matches,
      });
    }

    return NextResponse.json({
      status: "graph",
      graph: result.data,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo esgotado aguardando resposta do Critel."
        : error instanceof Error
          ? error.message
          : "Falha ao consultar Critel.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
