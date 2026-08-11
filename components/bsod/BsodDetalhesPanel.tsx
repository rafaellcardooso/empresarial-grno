"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BsodHealthBadge,
  BsodSignalMetric,
  buildBsodVlanCompareBadges,
} from "@/components/bsod/bsod-table-cells";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import { apiFetch } from "@/lib/config/base-path";
import type { PmeBsodRow } from "@/lib/queries/bsod";

type BsodDetalhesPanelProps = {
  open: boolean;
  row: PmeBsodRow | null;
  onClose: () => void;
  onSaved?: (row: PmeBsodRow) => void;
};

/** Painel lateral com endereço, profile, VLAN e métricas de sinal do PME. */
export function BsodDetalhesPanel({ open, row, onClose, onSaved }: BsodDetalhesPanelProps) {
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
        <div className="offcanvas-body">
          {row ? <BsodDetalhesBody row={row} onSaved={onSaved} /> : null}
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

function BsodDetalhesBody({
  row,
  onSaved,
}: {
  row: PmeBsodRow;
  onSaved?: (row: PmeBsodRow) => void;
}) {
  const vlanBadges = buildBsodVlanCompareBadges({
    cmtsVlan: row.bsod_vlan,
    crmCvlan: row.crm_cvlan,
  });
  const [editing, setEditing] = useState(false);
  const [cliente, setCliente] = useState(row.cliente ?? "");
  const [cadastroResponsavel, setCadastroResponsavel] = useState(row.cadastro_responsavel ?? "");
  const [designacao, setDesignacao] = useState(row.designacao ?? "");
  const [crmCvlan, setCrmCvlan] = useState(row.crm_cvlan ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditing(false);
    setError(null);
    setCliente(row.cliente ?? "");
    setCadastroResponsavel(row.cadastro_responsavel ?? "");
    setDesignacao(row.designacao ?? "");
    setCrmCvlan(row.crm_cvlan ?? "");
    setAddress(row.address ?? "");
  }, [
    row.id,
    row.mac,
    row.cliente,
    row.cadastro_responsavel,
    row.designacao,
    row.crm_cvlan,
    row.address,
  ]);

  /** Envia os campos manuais (inclui CVLAN CRM) para a API de inventário. */
  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/bsod/inventory/${encodeURIComponent(row.mac)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          cadastro_responsavel: cadastroResponsavel,
          designacao,
          address,
          crm_cvlan: crmCvlan,
        }),
      });
      const data = (await response.json()) as { error?: string; row?: PmeBsodRow };
      if (!response.ok || !data.row) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setEditing(false);
      onSaved?.(data.row);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div>
          {Number(row.manual_override) === 1 ? (
            <span className="badge text-bg-secondary">Dados manuais</span>
          ) : null}
        </div>
        {!editing ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setEditing(true)}
          >
            Editar cadastro
          </button>
        ) : null}
      </div>

      {editing ? (
        <form className="mb-4" onSubmit={handleSave}>
          <div className="mb-2">
            <label className="form-label" htmlFor="bsod-edit-cliente">
              Cliente
            </label>
            <input
              id="bsod-edit-cliente"
              className="form-control form-control-sm"
              value={cliente}
              maxLength={255}
              onChange={(event) => setCliente(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="mb-2">
            <label className="form-label" htmlFor="bsod-edit-cadastro">
              Cadastro responsável
            </label>
            <input
              id="bsod-edit-cadastro"
              className="form-control form-control-sm"
              value={cadastroResponsavel}
              maxLength={255}
              onChange={(event) => setCadastroResponsavel(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="mb-2">
            <label className="form-label" htmlFor="bsod-edit-designacao">
              Designação
            </label>
            <input
              id="bsod-edit-designacao"
              className="form-control form-control-sm"
              value={designacao}
              maxLength={255}
              onChange={(event) => setDesignacao(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="mb-2">
            <label className="form-label" htmlFor="bsod-edit-crm-cvlan">
              CVLAN CRM
            </label>
            <input
              id="bsod-edit-crm-cvlan"
              className="form-control form-control-sm"
              value={crmCvlan}
              maxLength={32}
              inputMode="numeric"
              placeholder="Ex.: 610"
              onChange={(event) => setCrmCvlan(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="bsod-edit-address">
              Endereço
            </label>
            <textarea
              id="bsod-edit-address"
              className="form-control form-control-sm"
              rows={3}
              value={address}
              maxLength={255}
              onChange={(event) => setAddress(event.target.value)}
              disabled={saving}
            />
          </div>
          {error ? <p className="text-danger small mb-2">{error}</p> : null}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError(null);
                setCliente(row.cliente ?? "");
                setCadastroResponsavel(row.cadastro_responsavel ?? "");
                setDesignacao(row.designacao ?? "");
                setCrmCvlan(row.crm_cvlan ?? "");
                setAddress(row.address ?? "");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

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
        <BsodDetailItem label="Cliente">{row.cliente || "—"}</BsodDetailItem>
        <BsodDetailItem label="Cadastro responsável">
          {row.cadastro_responsavel || "—"}
        </BsodDetailItem>
        <BsodDetailItem label="Designação">{row.designacao || "—"}</BsodDetailItem>
        <BsodDetailItem label="Produto">{row.produto || "—"}</BsodDetailItem>
        <BsodDetailItem label="Profile">{row.profile || "—"}</BsodDetailItem>
        <BsodDetailItem label="Endereço">{row.address || "—"}</BsodDetailItem>
        <BsodDetailItem label="VLAN CMTS">{vlanBadges.cmts}</BsodDetailItem>
        <BsodDetailItem label="CVLAN CRM">{vlanBadges.crm}</BsodDetailItem>
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
    </>
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
