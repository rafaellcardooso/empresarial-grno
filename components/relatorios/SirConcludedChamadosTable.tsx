"use client";

import { useState } from "react";
import { SirIncidentDetailsView } from "@/components/sir/SirIncidentDetailsView";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { SirConcludedChamadoRow } from "@/lib/models/sir-report";
import { TREATMENT_EVENT_LABELS } from "@/lib/tratativa/treatment-types";

type SirConcludedChamadosTableProps = {
  rows: SirConcludedChamadoRow[];
  total: number;
};

/** Tabela de chamados SIR concluídos com FCA e histórico expansíveis. */
export function SirConcludedChamadosTable({ rows, total }: SirConcludedChamadosTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="sir-concluidos" aria-labelledby="sir-concluidos-title">
      <header className="sir-concluidos__header">
        <div>
          <h2 className="sir-concluidos__title" id="sir-concluidos-title">
            {RELATORIOS_COPY.sirConcludedTitle}
          </h2>
          <p className="sir-concluidos__lead">{RELATORIOS_COPY.sirConcludedLead}</p>
        </div>
        <span className="sir-concluidos__count" aria-label={`${total} chamados`}>
          {total}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="sir-concluidos__empty">{RELATORIOS_COPY.sirConcludedEmpty}</p>
      ) : (
        <div className="sir-concluidos__surface">
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
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColOperador}</th>
                  <th scope="col">{RELATORIOS_COPY.sirConcludedColConcluido}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  return (
                    <ConcludedRowGroup
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
        </div>
      )}
    </section>
  );
}

type ConcludedRowGroupProps = {
  row: SirConcludedChamadoRow;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e painel de detalhe do chamado concluído. */
function ConcludedRowGroup({ row, isExpanded, onToggle }: ConcludedRowGroupProps) {
  const kindClass = row.recordKind === "RAL" ? "ral" : "rec";
  const detailLabel = isExpanded
    ? RELATORIOS_COPY.sirConcludedHideDetail
    : RELATORIOS_COPY.sirConcludedShowDetail;

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
            {row.recordKind}
          </span>
        </td>
        <td>
          <code className="sir-concluidos-table__key">{row.recordKey}</code>
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
          <div className="sir-concluidos-table__operator">
            <span className="sir-concluidos-table__operator-name">{row.userName}</span>
            <span className="sir-concluidos-table__operator-id">{row.userCorporateId}</span>
          </div>
        </td>
        <td>
          <time className="sir-concluidos-table__time" dateTime={row.concludedAt}>
            {formatDateTimePtBr(row.concludedAt)}
          </time>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="sir-concluidos-table__detail-row">
          <td colSpan={8}>
            <div className="sir-concluidos-panel-detail">
              <header className="sir-concluidos-panel-detail__head">
                <div className="sir-concluidos-panel-detail__identity">
                  <span className={`sir-concluidos-kind sir-concluidos-kind--${kindClass}`}>
                    {row.recordKind}
                  </span>
                  <code className="sir-concluidos-table__key">{row.recordKey}</code>
                  {row.classification ? (
                    <span className="sir-incident-pill">{row.classification}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="sir-concluidos-panel-detail__close"
                  onClick={onToggle}
                >
                  {RELATORIOS_COPY.sirConcludedHideDetail}
                </button>
              </header>

              <div className="sir-concluidos-panel-detail__grid">
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
                        {RELATORIOS_COPY.sirConcludedColAssumido}
                      </span>
                      <strong>{formatDateTimePtBr(row.startedAt)}</strong>
                    </div>
                    <div className="sir-concluidos-meta-chip">
                      <span className="sir-concluidos-meta-chip__label">
                        {RELATORIOS_COPY.sirConcludedColConcluido}
                      </span>
                      <strong>{formatDateTimePtBr(row.concludedAt)}</strong>
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

                <section
                  className="sir-concluidos-panel-card"
                  aria-label={RELATORIOS_COPY.sirConcludedFcaTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clipboard2-check" aria-hidden="true" />
                    {RELATORIOS_COPY.sirConcludedFcaTitle}
                  </h3>
                  {row.fca ? (
                    <div className="sir-concluidos-fca-grid">
                      <article className="sir-concluidos-fca-card">
                        <h4>{RELATORIOS_COPY.chamadosFato}</h4>
                        <p>{row.fca.fato || "—"}</p>
                      </article>
                      <article className="sir-concluidos-fca-card">
                        <h4>{RELATORIOS_COPY.chamadosCausa}</h4>
                        <p>{row.fca.causa || "—"}</p>
                      </article>
                      <article className="sir-concluidos-fca-card">
                        <h4>{RELATORIOS_COPY.chamadosAcao}</h4>
                        <p>{row.fca.acao || "—"}</p>
                      </article>
                    </div>
                  ) : (
                    <p className="sir-concluidos-panel-card__empty">—</p>
                  )}
                </section>

                <section
                  className="sir-concluidos-panel-card sir-concluidos-panel-card--history"
                  aria-label={RELATORIOS_COPY.sirConcludedHistoryTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clock-history" aria-hidden="true" />
                    {RELATORIOS_COPY.sirConcludedHistoryTitle}
                  </h3>
                  {row.history.length === 0 ? (
                    <p className="sir-concluidos-panel-card__empty">
                      {RELATORIOS_COPY.sirConcludedHistoryEmpty}
                    </p>
                  ) : (
                    <ol className="sir-concluidos-timeline">
                      {[...row.history].reverse().map((entry, index) => (
                        <li
                          key={`${entry.createdAt}-${index}`}
                          className="sir-concluidos-timeline__item"
                        >
                          <span className="sir-concluidos-timeline__dot" aria-hidden="true" />
                          <div className="sir-concluidos-timeline__body">
                            <div className="sir-concluidos-timeline__head">
                              <strong>
                                {TREATMENT_EVENT_LABELS[entry.eventType] ?? entry.eventType}
                              </strong>
                              <time dateTime={entry.createdAt}>
                                {formatDateTimePtBr(entry.createdAt)}
                              </time>
                            </div>
                            <span className="sir-concluidos-timeline__user">{entry.userName}</span>
                            {entry.note?.trim() ? (
                              <p className="sir-concluidos-timeline__note">{entry.note.trim()}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
