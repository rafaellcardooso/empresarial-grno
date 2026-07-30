"use client";

import { useEffect, type ReactNode } from "react";
import { formatDateTimeDisplay } from "@/components/ui/DateTimeStacked";
import { RalTipoBadge } from "@/components/sir/RalTipoBadge";
import { SirStatusBadge } from "@/components/sir/SirStatusBadge";

type SirDetalhesPanelProps = {
  open: boolean;
  recordLabel: "RAL" | "REC" | string;
  numRecup: string;
  row?: Record<string, unknown> | null;
  text: string;
  onClose: () => void;
};

/** Painel lateral com metadados e texto completo de RAL/REC. */
export function SirDetalhesPanel({
  open,
  recordLabel,
  numRecup,
  row = null,
  text,
  onClose,
}: SirDetalhesPanelProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div
        className={`offcanvas offcanvas-end sir-detalhes-offcanvas${open ? " show" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sir-detalhes-panel-title"
        aria-hidden={!open}
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">{recordLabel}</p>
            <h2 className="offcanvas-title h5 mb-0" id="sir-detalhes-panel-title">
              {numRecup}
            </h2>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="offcanvas-body">
          {row ? <SirDetalhesMeta recordLabel={recordLabel} row={row} /> : null}
          <p className="sir-detalhes-offcanvas__label mb-2">Detalhes</p>
          <div className="sir-detalhes-offcanvas__text">{text}</div>
        </div>
      </div>

      {open ? (
        <div
          className="offcanvas-backdrop fade show sir-detalhes-offcanvas-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      ) : null}
    </>
  );
}

function SirDetalhesMeta({
  recordLabel,
  row,
}: {
  recordLabel: string;
  row: Record<string, unknown>;
}) {
  const isRal = recordLabel === "RAL";

  return (
    <dl className="bsod-detalhes-grid mb-4">
      <SirDetailItem label="DDD">{textOrDash(row.ddd)}</SirDetailItem>
      {isRal ? (
        <>
          <SirDetailItem label="Tipo">
            <RalTipoBadge value={row.tipo_ral as string | null} />
          </SirDetailItem>
          <SirDetailItem label="CF">{textOrDash(row.cf_executante)}</SirDetailItem>
          <SirDetailItem label="Designação">{textOrDash(row.descricao)}</SirDetailItem>
          <SirDetailItem label="Duração">{textOrDash(row.duracao)}</SirDetailItem>
          <SirDetailItem label="Anormalidade">{textOrDash(row.codigo_anormalidade)}</SirDetailItem>
        </>
      ) : (
        <>
          <SirDetailItem label="Prioridade">{textOrDash(row.prioridade)}</SirDetailItem>
          <SirDetailItem label="Cliente">{textOrDash(row.cliente)}</SirDetailItem>
          <SirDetailItem label="Designação">{textOrDash(row.designacao)}</SirDetailItem>
          <SirDetailItem label="Pontos">{textOrDash(row.pontos)}</SirDetailItem>
          <SirDetailItem label="CF">{textOrDash(row.cf_executante)}</SirDetailItem>
        </>
      )}
      <SirDetailItem label="Abertura">
        {formatDateTimeDisplay(row.abertura as string | null)}
      </SirDetailItem>
      <SirDetailItem label="Atualizado em">
        {formatDateTimeDisplay(row.ultima_atualizacao as string | null)}
      </SirDetailItem>
      <SirDetailItem label="Status SIR">
        <SirStatusBadge value={row.status as string | null} />
      </SirDetailItem>
    </dl>
  );
}

function SirDetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="bsod-detalhes-grid__label">{label}</dt>
      <dd className="bsod-detalhes-grid__value">{children}</dd>
    </>
  );
}

function textOrDash(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}
