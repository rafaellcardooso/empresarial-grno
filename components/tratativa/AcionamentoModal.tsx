"use client";

import { AcionamentoForm } from "@/components/tratativa/AcionamentoForm";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { AcionamentoRecordKind } from "@/lib/models/acionamento";

type AcionamentoModalProps = {
  open: boolean;
  recordKind: AcionamentoRecordKind;
  recordKey: string;
  onClose: () => void;
  onRegistered?: () => void;
};

/** Modal para montar e copiar mensagem de acionamento WhatsApp. */
export function AcionamentoModal({
  open,
  recordKind,
  recordKey,
  onClose,
  onRegistered,
}: AcionamentoModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="acionamento-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="acionamento-modal-title">
                {UI_COPY.acionamentoTitle}
              </h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <AcionamentoForm
                recordKind={recordKind}
                recordKey={recordKey}
                onRegistered={onRegistered}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {UI_COPY.acionamentoClose}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}
