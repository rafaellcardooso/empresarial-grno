"use client";

import { useEffect, useState } from "react";
import { SirIncidentDetailsView } from "@/components/sir/SirIncidentDetailsView";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { fetchJson } from "@/lib/http/fetch-json";
import { sirListRangeLabel, sirTotalPages } from "@/lib/config/sir-pagination";
import type { SirReportAtivoRow, SirReportAtivosDim } from "@/lib/models/sir-report-ativos";

export type SirReportDrilldownSelection = {
  dim: SirReportAtivosDim;
  key: string;
  label: string;
  domain: "RAL" | "REC";
};

type SirReportActiveDrilldownProps = {
  selection: SirReportDrilldownSelection;
  tratativa?: string;
  reportDdd?: string;
  onClear: () => void;
};

type AtivosApiResponse = {
  status: string;
  total: number;
  page: number;
  pageSize: number;
  rows: SirReportAtivoRow[];
  mensagem?: string;
};

const DIM_LABEL: Record<SirReportAtivosDim, string> = {
  ddd: "DDD",
  tipo: "Classificação",
  cf: "CF",
};

/** Tabela paginada de ativos filtrados pela fatia selecionada nos rankings. */
export function SirReportActiveDrilldown({
  selection,
  tratativa,
  reportDdd,
  onClear,
}: SirReportActiveDrilldownProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<SirReportAtivoRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setExpandedKey(null);
  }, [selection.dim, selection.key, selection.domain]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      dim: selection.dim,
      key: selection.key,
      domain: selection.domain,
      page: String(page),
    });
    if (tratativa) params.set("tratativa", tratativa);
    if (reportDdd) params.set("reportDdd", reportDdd);

    setLoading(true);
    setError(null);
    setExpandedKey(null);

    void fetchJson<AtivosApiResponse>(`/api/relatorios/sir/ativos?${params.toString()}`, {
      cache: "no-store",
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (result.data.status !== "sucesso") {
        setError(result.data.mensagem ?? RELATORIOS_COPY.sirDrilldownError);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setRows(result.data.rows);
      setTotal(result.data.total);
      setPageSize(result.data.pageSize);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selection.dim, selection.key, selection.domain, page, tratativa, reportDdd]);

  const totalPages = sirTotalPages(total, pageSize);

  return (
    <section id="sir-drilldown" className="sir-drilldown" aria-labelledby="sir-drilldown-title">
      <header className="sir-drilldown__header">
        <div>
          <h3 className="sir-drilldown__title" id="sir-drilldown-title">
            {RELATORIOS_COPY.sirDrilldownTitle}
          </h3>
          <p className="sir-drilldown__lead">
            <span className="sir-drilldown__chip">{DIM_LABEL[selection.dim]}</span>
            <span className="sir-drilldown__chip">{selection.label}</span>
            <span className="sir-drilldown__chip sir-drilldown__chip--domain">
              {selection.domain}
            </span>
          </p>
          <p className="sir-drilldown__hint">{RELATORIOS_COPY.sirDrilldownLeadTable}</p>
        </div>
        <div className="sir-drilldown__actions">
          <span className="sir-drilldown__count">{total}</span>
          <button type="button" className="sir-drilldown__clear" onClick={onClear}>
            {RELATORIOS_COPY.sirDrilldownClear}
          </button>
        </div>
      </header>

      <div className="sir-drilldown__surface">
        {loading ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.sirDrilldownLoading}</p>
        ) : error ? (
          <p className="sir-drilldown__empty">{error}</p>
        ) : rows.length === 0 ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.sirDrilldownEmpty}</p>
        ) : (
          <div className="table-responsive">
            <table className="sir-concluidos-table mb-0">
              <thead>
                <tr>
                  <th scope="col" className="sir-concluidos-table__expand-col">
                    <span className="visually-hidden">Detalhe</span>
                  </th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColDominio}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColChamado}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColClassificacao}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColCf}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColResumo}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColAbertura}</th>
                  <th scope="col">Tratativa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowKey = `${row.kind}-${row.numRecup}`;
                  const isExpanded = expandedKey === rowKey;
                  return (
                    <ActiveRowGroup
                      key={rowKey}
                      row={row}
                      rowKey={rowKey}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedKey(isExpanded ? null : rowKey)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 ? (
          <div className="sir-drilldown__pager">
            <p className="sir-drilldown__pager-label">{sirListRangeLabel(page, pageSize, total)}</p>
            {total > pageSize ? (
              <div className="sir-drilldown__pager-controls">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </button>
                <span className="sir-drilldown__pager-page">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Próxima
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type ActiveRowGroupProps = {
  row: SirReportAtivoRow;
  rowKey: string;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e painel de detalhes do incidente ativo. */
function ActiveRowGroup({ row, isExpanded, onToggle }: ActiveRowGroupProps) {
  const kindClass = row.kind === "RAL" ? "ral" : "rec";
  const detailLabel = isExpanded
    ? RELATORIOS_COPY.sirConcludedHideDetail
    : RELATORIOS_COPY.sirDrilldownShowDetail;

  return (
    <>
      <tr className={`sir-concluidos-table__row${isExpanded ? " is-expanded" : ""}`}>
        <td>
          <button
            type="button"
            className="sir-concluidos-table__expand"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={detailLabel}
            title={detailLabel}
          >
            <i
              className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
              aria-hidden="true"
            />
          </button>
        </td>
        <td>
          <span className={`sir-concluidos-kind sir-concluidos-kind--${kindClass}`}>
            {row.kind}
          </span>
        </td>
        <td>
          <code className="sir-concluidos-table__key">{row.numRecup}</code>
        </td>
        <td>
          <span className="sir-incident-pill">{row.classification || "—"}</span>
        </td>
        <td>
          <span className="sir-incident-cf" title={row.cf ?? undefined}>
            {row.cf || "—"}
          </span>
        </td>
        <td>
          <span className="sir-incident-text" title={row.summary ?? undefined}>
            {row.summary || "—"}
          </span>
        </td>
        <td>
          <span className="sir-concluidos-table__time">{row.abertura || "—"}</span>
        </td>
        <td>
          <span className={`sir-drilldown__treatment sir-drilldown__treatment--${row.treatment}`}>
            {row.treatment === "em-tratativa" ? "Em tratativa" : "Pendente"}
          </span>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="sir-concluidos-table__detail-row">
          <td colSpan={8}>
            <div className="sir-concluidos-panel-detail">
              <header className="sir-concluidos-panel-detail__head">
                <div className="sir-concluidos-panel-detail__identity">
                  <span className={`sir-concluidos-kind sir-concluidos-kind--${kindClass}`}>
                    {row.kind}
                  </span>
                  <code className="sir-concluidos-table__key">{row.numRecup}</code>
                  {row.classification ? (
                    <span className="sir-incident-pill">{row.classification}</span>
                  ) : null}
                  <span
                    className={`sir-drilldown__treatment sir-drilldown__treatment--${row.treatment}`}
                  >
                    {row.treatment === "em-tratativa" ? "Em tratativa" : "Pendente"}
                  </span>
                </div>
                <button
                  type="button"
                  className="sir-concluidos-panel-detail__close"
                  onClick={onToggle}
                >
                  {RELATORIOS_COPY.sirConcludedHideDetail}
                </button>
              </header>

              <section
                className="sir-concluidos-panel-card sir-concluidos-panel-card--incident"
                aria-label={RELATORIOS_COPY.sirConcludedIncidentTitle}
              >
                <h3 className="sir-concluidos-panel-card__title">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  {RELATORIOS_COPY.sirConcludedIncidentTitle}
                </h3>

                <div className="sir-concluidos-panel-card__meta">
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sirConcludedColAbertura}
                    </span>
                    <strong>{row.abertura || "—"}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sirConcludedColClassificacao}
                    </span>
                    <strong>{row.classification || "—"}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip sir-concluidos-meta-chip--wide">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sirConcludedColCf}
                    </span>
                    <strong className="sir-concluidos-meta-chip__cf" title={row.cf ?? undefined}>
                      {row.cf || "—"}
                    </strong>
                  </div>
                </div>

                <div className="sir-concluidos-panel-card__field">
                  <span className="sir-concluidos-panel-card__field-label">
                    {RELATORIOS_COPY.sirConcludedColResumo}
                  </span>
                  <p className="sir-concluidos-panel-card__field-value">
                    {row.summary?.trim() || "—"}
                  </p>
                </div>

                <div className="sir-concluidos-panel-card__field">
                  <span className="sir-concluidos-panel-card__field-label">
                    {RELATORIOS_COPY.sirConcludedColDetalhes}
                  </span>
                  <SirIncidentDetailsView
                    text={row.details}
                    className="sir-concluidos-panel-card__details"
                    emptyLabel="—"
                  />
                </div>
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
