"use client";

import { FormEvent, useMemo, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import {
  CRITEL_DEFAULT_GRAPH_KIND,
  CRITEL_DEFAULT_GRAPH_TYPE,
  CRITEL_DEFAULT_RANGE,
  CRITEL_GRAPH_TYPES,
  CRITEL_RANGE_OPTIONS,
  isCritelDesignacaoFormatValid,
  normalizeCritelDesignacao,
  type CritelGraphData,
  type CritelGraphKind,
  type CritelSearchMatch,
} from "@/lib/config/critel";

type CritelPanelProps = {
  configured: boolean;
};

type GraphResponse =
  | { status: "graph"; graph: CritelGraphData }
  | { status: "matches"; query: string; matches: CritelSearchMatch[] }
  | { error: string };

type SummarySeries = {
  label: string;
  seriesKind: "in" | "out";
  media: string;
  maximo: string;
  ultimo: string;
  volume: string;
  perc95: string;
  perc99: string;
};

function buildSummarySeries(summary: CritelGraphData["summary"]): SummarySeries[] {
  const series: SummarySeries[] = [];

  for (const index of [0, 1]) {
    const labelEntry = summary.find((item) => item.key === `_label-${index}`);
    if (!labelEntry) continue;

    series.push({
      label: labelEntry.value,
      seriesKind: index === 0 ? "in" : "out",
      media: summary.find((item) => item.key === `_media-${index}`)?.value ?? "—",
      maximo: summary.find((item) => item.key === `_maximo-${index}`)?.value ?? "—",
      ultimo: summary.find((item) => item.key === `_ultimo-${index}`)?.value ?? "—",
      volume: summary.find((item) => item.key === `_volume-${index}`)?.value ?? "—",
      perc95: summary.find((item) => item.key === `_perc95-${index}`)?.value ?? "—",
      perc99: summary.find((item) => item.key === `_perc99-${index}`)?.value ?? "—",
    });
  }

  return series;
}

/** Formulário Critel — consulta por designação e exibe gráfico de desempenho. */
export function CritelPanel({ configured }: CritelPanelProps) {
  const [designacao, setDesignacao] = useState("");
  const [grafico, setGrafico] = useState(String(CRITEL_DEFAULT_GRAPH_TYPE));
  const [range, setRange] = useState(CRITEL_DEFAULT_RANGE);
  const [graphKind, setGraphKind] = useState<CritelGraphKind>(CRITEL_DEFAULT_GRAPH_KIND);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<CritelSearchMatch[]>([]);
  const [matchFilter, setMatchFilter] = useState("");
  const [queryUsed, setQueryUsed] = useState<string | null>(null);
  const [graph, setGraph] = useState<CritelGraphData | null>(null);

  const normalizedPreview = useMemo(() => normalizeCritelDesignacao(designacao), [designacao]);
  const formatValid = useMemo(
    () => !designacao.trim() || isCritelDesignacaoFormatValid(designacao),
    [designacao],
  );

  const imageSrc = useMemo(() => {
    if (!graph?.imageBase64) return null;
    return `data:${graph.imageContentType};base64,${graph.imageBase64}`;
  }, [graph]);

  const summarySeries = useMemo(() => (graph ? buildSummarySeries(graph.summary) : []), [graph]);

  const filteredMatches = useMemo(() => {
    const needle = matchFilter.trim().toUpperCase();
    if (!needle) return matches;
    return matches.filter(
      (match) =>
        match.designacao.toUpperCase().includes(needle) ||
        match.description.toUpperCase().includes(needle),
    );
  }, [matchFilter, matches]);

  async function requestGraph(selectedHierarquia?: string) {
    const normalized = normalizeCritelDesignacao(designacao);
    if (!normalized) {
      setError("Informe a designação do link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/grb/critel/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designacao: normalized,
          hierarquia: selectedHierarquia,
          grafico: Number(grafico),
          range,
          graphKind,
        }),
      });

      const payload = (await response.json()) as GraphResponse;
      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Falha ao consultar Critel.");
      }

      if ("error" in payload) {
        throw new Error(payload.error);
      }

      if (payload.status === "matches") {
        setMatches(payload.matches);
        setMatchFilter("");
        setQueryUsed(payload.query);
        setGraph(null);
        return;
      }

      setMatches([]);
      setMatchFilter("");
      setQueryUsed(null);
      setGraph(payload.graph);
    } catch (requestError) {
      setMatches([]);
      setQueryUsed(null);
      setGraph(null);
      setError(requestError instanceof Error ? requestError.message : "Falha ao consultar Critel.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestGraph();
  }

  function handleDesignacaoBlur() {
    if (!designacao.trim()) return;
    setDesignacao(normalizeCritelDesignacao(designacao));
  }

  function handleSelectMatch(hierarquia: string) {
    void requestGraph(hierarquia);
  }

  return (
    <div className="critel-panel d-flex flex-column gap-3">
      <ContentCard title="Consulta de circuito" bodyClassName="p-0">
        {!configured ? (
          <p className="text-secondary mb-0 p-3">
            Critel não configurado. Defina <code>CRITEL_BASE_URL</code> no ambiente.
          </p>
        ) : (
          <form className="critel-panel__form" onSubmit={handleSubmit}>
            <div className="critel-panel__search">
              <label className="critel-panel__search-label" htmlFor="critel-designacao">
                Designação do link
              </label>
              <div className="critel-panel__search-row">
                <input
                  id="critel-designacao"
                  className="form-control critel-panel__designacao-input"
                  value={designacao}
                  onChange={(event) => setDesignacao(event.target.value)}
                  onBlur={handleDesignacaoBlur}
                  placeholder="itz/ip/01816"
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary critel-panel__submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden
                      />
                      Consultando…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2" aria-hidden />
                      Consultar
                    </>
                  )}
                </button>
              </div>
              <p className="critel-panel__hint mb-0">
                Formato <code>local/tipo/número</code> — aceita minúsculas; normalizado para{" "}
                {normalizedPreview || "ITZ/IP/01816"}.
              </p>
              {!formatValid ? (
                <p className="critel-panel__hint critel-panel__hint--warn mb-0">
                  Verifique o formato da designação (ex.: itz/ip/01816).
                </p>
              ) : null}
            </div>

            <div className="critel-panel__options">
              <div className="critel-panel__option">
                <span className="critel-panel__option-label">Gráfico</span>
                <select
                  id="critel-grafico"
                  className="form-select form-select-sm"
                  value={grafico}
                  onChange={(event) => setGrafico(event.target.value)}
                  disabled={loading}
                >
                  {CRITEL_GRAPH_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="critel-panel__option critel-panel__option--wide">
                <span className="critel-panel__option-label">Abrangência</span>
                <div className="critel-panel__range-group" role="group" aria-label="Abrangência">
                  {CRITEL_RANGE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`btn btn-sm ${range === item.value ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setRange(item.value)}
                      disabled={loading}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="critel-panel__option">
                <span className="critel-panel__option-label">Tipo</span>
                <div className="btn-group btn-group-sm" role="group" aria-label="Tipo de gráfico">
                  <button
                    type="button"
                    className={`btn ${graphKind === "medias" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setGraphKind("medias")}
                    disabled={loading}
                  >
                    Médias
                  </button>
                  <button
                    type="button"
                    className={`btn ${graphKind === "picos" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setGraphKind("picos")}
                    disabled={loading}
                  >
                    Máximos
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </ContentCard>

      {error ? (
        <ContentCard title="Erro" bodyClassName="p-3">
          <p className="text-danger mb-0">
            <i className="bi bi-exclamation-triangle me-2" aria-hidden />
            {error}
          </p>
        </ContentCard>
      ) : null}

      {matches.length > 0 ? (
        <ContentCard title={`${matches.length} circuitos encontrados`} bodyClassName="p-3">
          <p className="text-secondary small mb-3">
            Query: <code>{queryUsed}</code>
          </p>
          {matches.length > 5 ? (
            <input
              type="search"
              className="form-control form-control-sm mb-3"
              placeholder="Filtrar resultados…"
              value={matchFilter}
              onChange={(event) => setMatchFilter(event.target.value)}
            />
          ) : null}
          <div className="critel-panel__matches">
            {filteredMatches.length === 0 ? (
              <p className="text-secondary mb-0">Nenhum resultado para o filtro informado.</p>
            ) : (
              filteredMatches.map((match) => (
                <button
                  key={match.hierarquia}
                  type="button"
                  className="critel-panel__match"
                  disabled={loading}
                  onClick={() => handleSelectMatch(match.hierarquia)}
                >
                  <span className="critel-panel__match-designacao">{match.designacao}</span>
                  {match.description ? (
                    <span className="critel-panel__match-desc">{match.description}</span>
                  ) : null}
                  <i className="bi bi-chevron-right critel-panel__match-icon" aria-hidden />
                </button>
              ))
            )}
          </div>
        </ContentCard>
      ) : null}

      {graph ? (
        <>
          <div className="critel-panel__meta row g-3">
            <div className="col-md-4">
              <ContentCard title="Circuito" bodyClassName="p-3">
                <p className="critel-panel__meta-value mb-1">{graph.designacao}</p>
                <p className="critel-panel__meta-sub mb-0">{graph.description || "—"}</p>
              </ContentCard>
            </div>
            <div className="col-md-4">
              <ContentCard title="Consulta" bodyClassName="p-3">
                <p className="critel-panel__meta-value mb-1">{graph.graphType}</p>
                <p className="critel-panel__meta-sub mb-0">
                  {graph.rangeLabel} · {graph.graphKind === "medias" ? "Médias" : "Máximos"}
                </p>
              </ContentCard>
            </div>
            <div className="col-md-4">
              <ContentCard title="Período" bodyClassName="p-3">
                <p className="critel-panel__meta-value mb-1">
                  {graph.datainicio} — {graph.datafim}
                </p>
                {graph.lastUpdate ? (
                  <p className="critel-panel__meta-sub mb-0">Atualizado {graph.lastUpdate}</p>
                ) : null}
              </ContentCard>
            </div>
          </div>

          {summarySeries.length > 0 ? (
            <div className="row g-3">
              {summarySeries.map((series) => (
                <div key={series.label} className="col-md-6">
                  <ContentCard
                    title={
                      <span
                        className={`critel-panel__series-title critel-panel__series-title--${series.seriesKind}`}
                      >
                        {series.label}
                      </span>
                    }
                    bodyClassName="p-3"
                  >
                    <div
                      className={`critel-panel__metrics critel-panel__metrics--${series.seriesKind}`}
                    >
                      <div>
                        <span className="critel-panel__metric-label">Média</span>
                        <span className="critel-panel__metric-value critel-panel__metric-value--accent">
                          {series.media}
                        </span>
                      </div>
                      <div>
                        <span className="critel-panel__metric-label">Máximo</span>
                        <span className="critel-panel__metric-value">{series.maximo}</span>
                      </div>
                      <div>
                        <span className="critel-panel__metric-label">Último</span>
                        <span className="critel-panel__metric-value">{series.ultimo}</span>
                      </div>
                      <div>
                        <span className="critel-panel__metric-label">95º pct.</span>
                        <span className="critel-panel__metric-value">{series.perc95}</span>
                      </div>
                      <div>
                        <span className="critel-panel__metric-label">Volume</span>
                        <span className="critel-panel__metric-value">{series.volume}</span>
                      </div>
                    </div>
                  </ContentCard>
                </div>
              ))}
            </div>
          ) : null}

          {imageSrc ? (
            <ContentCard title="Gráfico" bodyClassName="p-3">
              <div className="critel-panel__graph-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={`Gráfico Critel ${graph.designacao}`}
                  className="critel-panel__graph-image"
                />
              </div>
            </ContentCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
