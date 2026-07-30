"use client";

import { useEffect, type ReactNode } from "react";
import { BsodHealthBadge, BsodSignalMetric } from "@/components/bsod/bsod-table-cells";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import type { PmeBsodRow } from "@/lib/queries/bsod";

type BsodDetalhesPanelProps = {
  open: boolean;
  row: PmeBsodRow | null;
  onClose: () => void;
};

/** Painel lateral com endereço, profile, VLAN e métricas de sinal do PME. */
export function BsodDetalhesPanel({ open, row, onClose }: BsodDetalhesPanelProps) {
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
        className={`offcanvas offcanvas-end sir-detalhes-offcanvas bsod-detalhes-offcanvas${open ? " show" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bsod-detalhes-panel-title"
        aria-hidden={!open}
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">PME · BSOD</p>
            <h2 className="offcanvas-title h5 mb-0" id="bsod-detalhes-panel-title">
              {row?.mac ?? "—"}
            </h2>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="offcanvas-body">{row ? <BsodDetalhesBody row={row} /> : null}</div>
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

function BsodDetalhesBody({ row }: { row: PmeBsodRow }) {
  return (
    <dl className="bsod-detalhes-grid">
      <BsodDetailItem label="Status">
        <BsodHealthBadge label={row.monitor_label} status={row.monitor_status} />
      </BsodDetailItem>
      <BsodDetailItem label="Operação">{row.ope_label || row.ope || "—"}</BsodDetailItem>
      <BsodDetailItem label="CMTS">{row.cmts || "—"}</BsodDetailItem>
      <BsodDetailItem label="Node">{row.node || "—"}</BsodDetailItem>
      <BsodDetailItem label="MAC">{row.mac || "—"}</BsodDetailItem>
      <BsodDetailItem label="ID cable">{row.id_cable || "—"}</BsodDetailItem>
      <BsodDetailItem label="Contrato">{row.contrato || "—"}</BsodDetailItem>
      <BsodDetailItem label="Endereço">{row.address || "—"}</BsodDetailItem>
      <BsodDetailItem label="Profile">{row.profile || "—"}</BsodDetailItem>
      <BsodDetailItem label="VLAN BSOD">
        {row.bsod_vlan != null ? <span className="bsod-vlan-badge">{row.bsod_vlan}</span> : "—"}
      </BsodDetailItem>
      <BsodDetailItem label="VLAN operacional">{row.vlan || "—"}</BsodDetailItem>
      <BsodDetailItem label="TX">
        <BsodSignalMetric kind="tx" value={row.tx} monitorStatus={row.monitor_status} />
      </BsodDetailItem>
      <BsodDetailItem label="RX">
        <BsodSignalMetric kind="rx" value={row.rx} monitorStatus={row.monitor_status} />
      </BsodDetailItem>
      <BsodDetailItem label="MER">
        <BsodSignalMetric kind="mer" value={row.mer} monitorStatus={row.monitor_status} />
      </BsodDetailItem>
      <BsodDetailItem label="Última leitura">
        <DateTimeStacked value={row.monitor_time} />
      </BsodDetailItem>
    </dl>
  );
}

function BsodDetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="bsod-detalhes-grid__label">{label}</dt>
      <dd className="bsod-detalhes-grid__value">{children}</dd>
    </>
  );
}
