"use client";

import { useState } from "react";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { SdhConcludedChamadoRow } from "@/lib/models/sdh-report";
import { TREATMENT_EVENT_LABELS } from "@/lib/tratativa/treatment-types";

type SdhConcludedChamadosTableProps = {
  rows: SdhConcludedChamadoRow[];
  total: number;
};

/** Tabela de encerramentos SDH com FCA e histórico expansíveis. */
export function SdhConcludedChamadosTable({ rows, total }: SdhConcludedChamadosTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="sir-concluidos" aria-labelledby="sdh-concluidos-title">
      <header className="sir-concluidos__header">
        <div>
          <h2 className="sir-concluidos__title" id="sdh-concluidos-title">
            {RELATORIOS_COPY.sdhConcludedTitle}
          </h2>
          <p className="sir-concluidos__lead">{RELATORIOS_COPY.sdhConcludedLead}</p>
        </div>
        <span className="sir-concluidos__count" aria-label={`${total} encerramentos`}>
          {total}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="sir-concluidos__empty">{RELATORIOS_COPY.sdhConcludedEmpty}</p>
      ) : (
        <div className="sir-concluidos__surface">
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
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColOperador}</th>
                  <th scope="col">{RELATORIOS_COPY.sdhConcludedColConcluido}</th>
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
  row: SdhConcludedChamadoRow;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e painel de detalhe do encerramento SDH. */
function ConcludedRowGroup({ row, isExpanded, onToggle }: ConcludedRowGroupProps) {
  const detailLabel = isExpanded
    ? RELATORIOS_COPY.sdhConcludedHideDetail
    : RELATORIOS_COPY.sdhConcludedShowDetail;

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
          <code className="sir-concluidos-table__key">{row.ne || row.alarmId}</code>
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
                  <span className="sir-concluidos-kind sir-concluidos-kind--rec">SDH</span>
                  <code className="sir-concluidos-table__key">{row.ne || row.alarmId}</code>
                  {row.alarme ? <span className="sir-incident-pill">{row.alarme}</span> : null}
                </div>
                <button
                  type="button"
                  className="sir-concluidos-panel-detail__close"
                  onClick={onToggle}
                >
                  {RELATORIOS_COPY.sdhConcludedHideDetail}
                </button>
              </header>

              <div className="sir-concluidos-panel-detail__grid">
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
                      <strong>{row.alarmId}</strong>
                    </div>
                    <div className="sir-concluidos-meta-chip">
                      <span className="sir-concluidos-meta-chip__label">
                        {RELATORIOS_COPY.sdhConcludedColDataAlarme}
                      </span>
                      <strong>{formatDateTimePtBr(row.dataAlarme) || "—"}</strong>
                    </div>
                    <div className="sir-concluidos-meta-chip">
                      <span className="sir-concluidos-meta-chip__label">
                        {RELATORIOS_COPY.sdhConcludedColAssumido}
                      </span>
                      <strong>{row.startedAt ? formatDateTimePtBr(row.startedAt) : "—"}</strong>
                    </div>
                    <div className="sir-concluidos-meta-chip">
                      <span className="sir-concluidos-meta-chip__label">
                        {RELATORIOS_COPY.sdhConcludedColConcluido}
                      </span>
                      <strong>{formatDateTimePtBr(row.concludedAt)}</strong>
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
                  </div>
                </section>

                <section
                  className="sir-concluidos-panel-card"
                  aria-label={RELATORIOS_COPY.sdhConcludedFcaTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clipboard2-check" aria-hidden="true" />
                    {RELATORIOS_COPY.sdhConcludedFcaTitle}
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
                  aria-label={RELATORIOS_COPY.sdhConcludedHistoryTitle}
                >
                  <h3 className="sir-concluidos-panel-card__title">
                    <i className="bi bi-clock-history" aria-hidden="true" />
                    {RELATORIOS_COPY.sdhConcludedHistoryTitle}
                  </h3>
                  {row.history.length === 0 ? (
                    <p className="sir-concluidos-panel-card__empty">
                      {RELATORIOS_COPY.sdhConcludedHistoryEmpty}
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
