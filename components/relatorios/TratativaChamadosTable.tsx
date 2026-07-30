"use client";

import { useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import {
  TRATATIVA_CHAMADO_STATUS_LABELS,
  type TratativaChamadoStatus,
} from "@/lib/config/tratativa-chamados";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { TratativaChamadoRow } from "@/lib/models/tratativa-report";

type TratativaChamadosTableProps = {
  rows: TratativaChamadoRow[];
  total: number;
};

/** Tabela de chamados BSOD por status, com FCA expansível quando houver validação. */
export function TratativaChamadosTable({ rows, total }: TratativaChamadosTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="tratativa-chamados" aria-labelledby="tratativa-chamados-title">
      <header className="tratativa-chamados__header mb-2">
        <h2 className="h5 mb-1" id="tratativa-chamados-title">
          {RELATORIOS_COPY.chamadosTitle}
        </h2>
        <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.chamadosLead}</p>
      </header>

      <ContentCard title={`${total} chamado(s)`} bodyClassName="p-0">
        {rows.length === 0 ? (
          <p className="text-body-secondary mb-0 p-3">{RELATORIOS_COPY.emptyChamados}</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0 tratativa-chamados-table">
              <thead>
                <tr>
                  <th scope="col" className="tratativa-chamados-table__expand-col" />
                  <th scope="col">{RELATORIOS_COPY.chamadosColMac}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColStatus}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColOperador}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColAssumido}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColRegistrado}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColValidado}</th>
                  <th scope="col">{RELATORIOS_COPY.chamadosColConcluido}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const hasFca = Boolean(row.fca);
                  const isExpanded = expandedId === row.id;

                  return (
                    <ChamadoRowGroup
                      key={row.id}
                      row={row}
                      hasFca={hasFca}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </section>
  );
}

type ChamadoRowGroupProps = {
  row: TratativaChamadoRow;
  hasFca: boolean;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Linha principal e detalhe FCA do chamado. */
function ChamadoRowGroup({ row, hasFca, isExpanded, onToggle }: ChamadoRowGroupProps) {
  return (
    <>
      <tr className={hasFca ? "tratativa-chamados-table__row--expandable" : undefined}>
        <td>
          {hasFca ? (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 tratativa-chamados-table__expand"
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? RELATORIOS_COPY.chamadosHideFca : RELATORIOS_COPY.chamadosShowFca
              }
              title={isExpanded ? RELATORIOS_COPY.chamadosHideFca : RELATORIOS_COPY.chamadosShowFca}
            >
              <i
                className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="text-body-secondary">—</span>
          )}
        </td>
        <td>
          <code className="tratativa-chamados-table__mac">{row.recordKey}</code>
        </td>
        <td>
          <span className={statusBadgeClass(row.status)}>
            {TRATATIVA_CHAMADO_STATUS_LABELS[row.status]}
          </span>
        </td>
        <td>
          <div className="tratativa-chamados-table__operator">
            <span>{row.userName}</span>
            <span className="text-body-secondary small">{row.userCorporateId}</span>
          </div>
        </td>
        <td>{formatDateTimePtBr(row.startedAt)}</td>
        <td>{formatDateTimePtBr(row.acionadoAt)}</td>
        <td>{formatDateTimePtBr(row.validatedAt)}</td>
        <td>{formatDateTimePtBr(row.concludedAt)}</td>
      </tr>
      {hasFca && isExpanded && row.fca ? (
        <tr className="tratativa-chamados-table__fca-row">
          <td colSpan={8}>
            <div className="tratativa-chamados-fca">
              <div className="tratativa-chamados-fca__meta">
                <span className="tratativa-chamados-fca__title">
                  {RELATORIOS_COPY.chamadosFcaTitle}
                </span>
                {row.outcome ? (
                  <span className="text-body-secondary small">
                    {row.outcome === "aprovada"
                      ? RELATORIOS_COPY.kpiAprovadas
                      : RELATORIOS_COPY.kpiReprovadas}
                  </span>
                ) : null}
              </div>
              <dl className="tratativa-chamados-fca__grid mb-0">
                <div>
                  <dt>{RELATORIOS_COPY.chamadosFato}</dt>
                  <dd>{row.fca.fato || "—"}</dd>
                </div>
                <div>
                  <dt>{RELATORIOS_COPY.chamadosCausa}</dt>
                  <dd>{row.fca.causa || "—"}</dd>
                </div>
                <div>
                  <dt>{RELATORIOS_COPY.chamadosAcao}</dt>
                  <dd>{row.fca.acao || "—"}</dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Classe visual do badge conforme status do chamado. */
function statusBadgeClass(status: TratativaChamadoStatus): string {
  const base = "tratativa-workflow-badge";
  if (status === "acionado") return `${base} ${base}--acionado`;
  if (status === "validacao_pendente") return `${base} ${base}--pendente`;
  if (status === "validado" || status === "concluido") return `${base} ${base}--validado`;
  if (status === "validacao_reprovada") return `${base} ${base}--reprovada`;
  return base;
}
