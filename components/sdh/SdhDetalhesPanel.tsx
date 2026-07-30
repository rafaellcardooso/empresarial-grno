"use client";

import { useEffect, type ReactNode } from "react";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type SdhDetalhesPanelProps = {
  open: boolean;
  alarm: SdhAlarmListItem | null;
  onClose: () => void;
};

/** Painel lateral com metadados técnicos do alarme SDH. */
export function SdhDetalhesPanel({ open, alarm, onClose }: SdhDetalhesPanelProps) {
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
        aria-labelledby="sdh-detalhes-panel-title"
        aria-hidden={!open}
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">SDH</p>
            <h2 className="offcanvas-title h5 mb-0" id="sdh-detalhes-panel-title">
              {alarm?.ne?.trim() || alarm?.id || "—"}
            </h2>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="offcanvas-body">{alarm ? <SdhDetalhesBody alarm={alarm} /> : null}</div>
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

function SdhDetalhesBody({ alarm }: { alarm: SdhAlarmListItem }) {
  const tratativaLabel =
    Number(alarm.em_tratativa) === 1
      ? `Em tratativa · ${alarm.tratativa_user_login ?? "—"}`
      : "Pendente";
  const dataAlarme =
    formatDateTimePtBr(
      typeof alarm.data_alarme === "string"
        ? alarm.data_alarme
        : (alarm.data_alarme?.toISOString() ?? null),
    ) || "—";

  return (
    <dl className="bsod-detalhes-grid">
      <SdhDetailItem label="ID">{String(alarm.id)}</SdhDetailItem>
      <SdhDetailItem label="DDD">{alarm.ddd?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Município">
        {alarm.municipio?.trim().toUpperCase() || "—"}
      </SdhDetailItem>
      <SdhDetailItem label="NE">{alarm.ne?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Porta">{alarm.porta?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Alarme">{alarm.alarme?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Circuito">{alarm.circuito?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="SIR">{alarm.sir?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="IP">{alarm.ip?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Gerência">{alarm.gerencia?.trim() || "—"}</SdhDetailItem>
      <SdhDetailItem label="Data do alarme">{dataAlarme}</SdhDetailItem>
      <SdhDetailItem label="Tratativa">{tratativaLabel}</SdhDetailItem>
    </dl>
  );
}

function SdhDetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="bsod-detalhes-grid__label">{label}</dt>
      <dd className="bsod-detalhes-grid__value">{children}</dd>
    </>
  );
}
