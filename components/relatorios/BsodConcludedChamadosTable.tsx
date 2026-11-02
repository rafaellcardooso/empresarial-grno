"use client";

import { useState } from "react";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { BsodConcludedChamadoRow } from "@/lib/queries/bsod-concluded-chamados";
import { TREATMENT_EVENT_LABELS } from "@/lib/tratativa/treatment-types";

type BsodConcludedChamadosTableProps = {
  rows: BsodConcludedChamadoRow[];
  total: number;
};

/** Tabela de encerramentos BSOD com FCA e histórico expansíveis. */
export function BsodConcludedChamadosTable({ rows, total }: BsodConcludedChamadosTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="sir-concluidos" aria-labelledby="bsod-concluidos-title">
      <header className="sir-concluidos__header">
        <div>
          <h2 className="sir-concluidos__title" id="bsod-concluidos-title">
            {RELATORIOS_COPY.bsodConcludedTitle}
          </h2>
          <p className="sir-concluidos__lead">{RELATORIOS_COPY.bsodConcludedLead}</p>
        </div>
        <span className="sir-concluidos__count" aria-label={`${total} encerramentos`}>
          {total}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="sir-concluidos__empty">{RELATORIOS_COPY.bsodConcludedEmpty}</p>
      ) : (
        <div className="sir-concluidos__surface">
          <div className="table-responsive">
            <table className="sir-concluidos-table mb-0">
              <thead>
                <tr>
                  <th scope="col" className="sir-concluidos-table__expand-col">
                    <span className="visually-hidden">Detalhe</span>
                  </th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColMac}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColOperador}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColAssumido}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColConcluido}</th>
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
  row: BsodConcludedChamadoRow;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e painel de detalhe do encerramento BSOD. */
function ConcludedRowGroup({ row, isExpanded, onToggle }: ConcludedRowGroupProps) {
  const detailLabel = isExpanded
    ? RELATORIOS_COPY.bsodConcludedHideDetail
    : RELATORIOS_COPY.bsodConcludedShowDetail;

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
          <code className="sir-concluidos-table__key">{row.recordKey}</code>
        </td>
        <td>
          <div className="sir-concluidos-table__operator">
            <span className="sir-concluidos-table__operator-name">{row.userName}</span>
            <span className="sir-concluidos-table__operator-id">{row.userCorporateId}</span>
          </div>
        </td>
        <td>
          <time className="sir-concluidos-table__time" dateTime={row.startedAt}>
            {formatDateTimePtBr(row.startedAt)}
          </time>
        </td>
        <td>
          <time className="sir-concluidos-table__time" dateTime={row.concludedAt}>
            {formatDateTimePtBr(row.concludedAt)}
          </time>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="sir-concluidos-table__detail-row">
          <td colSpan={5}>
            <div className="sir-concluidos-panel-detail">
              <header className="sir-concluidos-panel-detail__head">
                <div className="sir-concluidos-panel-detail__identity">
                  <span className="sir-concluidos-kind sir-concluidos-kind--rec">BSOD</span>
                  <code className="sir-concluidos-table__key">{row.recordKey}</code>
                </div>
                <button
                  type="button"
                  className="sir-concluidos-panel-detail__close"
                  onClick={onToggle}
                >
                  {RELATORIOS_COPY.bsodConcludedHideDetail}
                </button>
              </header>

              <div className="sir-concluidos-panel-detail__grid">
                <section
                  className="sir-concluidos-panel-card"
                  aria-label={RELATORIOS_COPY.bsodConcludedFcaTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clipboard2-check" aria-hidden="true" />
                    {RELATORIOS_COPY.bsodConcludedFcaTitle}
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
                  aria-label={RELATORIOS_COPY.bsodConcludedHistoryTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clock-history" aria-hidden="true" />
                    {RELATORIOS_COPY.bsodConcludedHistoryTitle}
                  </h3>
                  {row.history.length === 0 ? (
                    <p className="sir-concluidos-panel-card__empty">
                      {RELATORIOS_COPY.bsodConcludedHistoryEmpty}
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
