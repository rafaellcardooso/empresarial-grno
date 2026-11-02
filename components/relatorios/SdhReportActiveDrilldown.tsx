"use client";

import { useEffect, useState } from "react";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { sdhListRangeLabel, sdhTotalPages } from "@/lib/config/sdh-pagination";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { fetchJson } from "@/lib/http/fetch-json";
import type { SdhReportAtivoRow, SdhReportAtivosDim } from "@/lib/models/sdh-report-ativos";

export type SdhReportDrilldownSelection = {
  dim: SdhReportAtivosDim;
  key: string;
  label: string;
};

type SdhReportActiveDrilldownProps = {
  selection: SdhReportDrilldownSelection;
  vendor?: string;
  ddd?: string;
  onClear: () => void;
};

type AtivosApiResponse = {
  status: string;
  total: number;
  page: number;
  pageSize: number;
  rows: SdhReportAtivoRow[];
  mensagem?: string;
};

const DIM_LABEL: Record<SdhReportAtivosDim, string> = {
  ddd: "DDD",
  vendor: "Gerência",
  municipio: "Município",
  alarme: "Alarme",
};

/** Tabela paginada de ativos filtrados pela fatia selecionada nos rankings. */
export function SdhReportActiveDrilldown({
  selection,
  vendor,
  ddd,
  onClear,
}: SdhReportActiveDrilldownProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<SdhReportAtivoRow[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [selection.dim, selection.key]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      dim: selection.dim,
      key: selection.key,
      page: String(page),
    });
    if (vendor) params.set("vendor", vendor);
    if (ddd) params.set("ddd", ddd);

    setLoading(true);
    setError(null);
    setExpandedId(null);

    void fetchJson<AtivosApiResponse>(`/api/relatorios/sdh/ativos?${params.toString()}`, {
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
        setError(result.data.mensagem ?? RELATORIOS_COPY.sdhDrilldownError);
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
  }, [selection.dim, selection.key, page, vendor, ddd]);

  const totalPages = sdhTotalPages(total, pageSize);

  return (
    <section id="sdh-drilldown" className="sir-drilldown" aria-labelledby="sdh-drilldown-title">
      <header className="sir-drilldown__header">
        <div>
          <h3 className="sir-drilldown__title" id="sdh-drilldown-title">
            {RELATORIOS_COPY.sdhDrilldownTitle}
          </h3>
          <p className="sir-drilldown__lead">
            <span className="sir-drilldown__chip">{DIM_LABEL[selection.dim]}</span>
            <span className="sir-drilldown__chip">{selection.label}</span>
          </p>
          <p className="sir-drilldown__hint">{RELATORIOS_COPY.sdhDrilldownLeadTable}</p>
        </div>
        <div className="sir-drilldown__actions">
          <span className="sir-drilldown__count">{total}</span>
          <button type="button" className="sir-drilldown__clear" onClick={onClear}>
            {RELATORIOS_COPY.sdhDrilldownClear}
          </button>
        </div>
      </header>

      <div className="sir-drilldown__surface">
        {loading ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.sdhDrilldownLoading}</p>
        ) : error ? (
          <p className="sir-drilldown__empty">{error}</p>
        ) : rows.length === 0 ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.sdhDrilldownEmpty}</p>
        ) : (
          <div className="table-responsive">
            <table className="sir-concluidos-table mb-0">
              <thead>
                <tr>
                  <th scope="col" className="sir-concluidos-table__expand-col">
                    <span className="visually-hidden">Detalhe</span>
                  </th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColNe}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColAlarme}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColDdd}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColMunicipio}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColVendor}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColDataAlarme}</th>
                  <th scope="col">Tratativa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  return (
                    <ActiveRowGroup
                      key={row.id}
                      row={row}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 ? (
          <div className="sir-drilldown__pager">
            <p className="sir-drilldown__pager-label">{sdhListRangeLabel(page, pageSize, total)}</p>
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
  row: SdhReportAtivoRow;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e painel de detalhe do alarme ativo. */
function ActiveRowGroup({ row, isExpanded, onToggle }: ActiveRowGroupProps) {
  const detailLabel = isExpanded
    ? RELATORIOS_COPY.sdhConcludedHideDetail
    : RELATORIOS_COPY.sdhDrilldownShowDetail;

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
          <code className="sir-concluidos-table__key">{row.ne || row.id}</code>
        </td>
        <td>
          <span className="sir-incident-text" title={row.alarme ?? undefined}>
            {row.alarme || "—"}
          </span>
        </td>
        <td>{row.ddd || "—"}</td>
        <td>{row.municipio || "—"}</td>
        <td>
          <span className="sir-incident-pill">{row.vendor || "—"}</span>
        </td>
        <td>
          <span className="sir-concluidos-table__time">
            {formatDateTimePtBr(row.dataAlarme) || "—"}
          </span>
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
                  <span className="sir-concluidos-kind sir-concluidos-kind--rec">SDH</span>
                  <code className="sir-concluidos-table__key">{row.ne || row.id}</code>
                  {row.alarme ? <span className="sir-incident-pill">{row.alarme}</span> : null}
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
                  {RELATORIOS_COPY.sdhConcludedHideDetail}
                </button>
              </header>

              <section
                className="sir-concluidos-panel-card sir-concluidos-panel-card--incident"
                aria-label={RELATORIOS_COPY.sdhConcludedAlarmTitle}
              >
                <h3 className="sir-concluidos-panel-card__title">
                  <i className="bi bi-broadcast" aria-hidden="true" />
                  {RELATORIOS_COPY.sdhConcludedAlarmTitle}
                </h3>

                <div className="sir-concluidos-panel-card__meta">
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sdhConcludedColId}
                    </span>
                    <strong>{row.id}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sdhConcludedColDataAlarme}
                    </span>
                    <strong>{formatDateTimePtBr(row.dataAlarme) || "—"}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sdhConcludedColPorta}
                    </span>
                    <strong>{row.porta || "—"}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip sir-concluidos-meta-chip--wide">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sdhConcludedColCircuito}
                    </span>
                    <strong title={row.circuito ?? undefined}>{row.circuito || "—"}</strong>
                  </div>
                  <div className="sir-concluidos-meta-chip">
                    <span className="sir-concluidos-meta-chip__label">
                      {RELATORIOS_COPY.sdhConcludedColOperador}
                    </span>
                    <strong>{row.tratativaUserLogin || "—"}</strong>
                  </div>
                </div>
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
