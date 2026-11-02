"use client";

import { SirPrepPanel } from "@/components/tratativa/SirPrepPanel";
import { UI_COPY } from "@/lib/config/ui-copy";

type SirPrepModalProps = {
  open: boolean;
  recordKind: "RAL" | "REC" | "SDH";
  recordKey: string;
  unlocked?: boolean;
  onClose: () => void;
  onRegistered?: () => void;
};

/** Modal de acionamento para SIR ou SDH (FCA só na conclusão). */
export function SirPrepModal({
  open,
  recordKind,
  recordKey,
  unlocked = false,
  onClose,
  onRegistered,
}: SirPrepModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sir-prep-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="sir-prep-modal-title">
                {UI_COPY.acionamentoTitle}
              </h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <SirPrepPanel
                recordKind={recordKind}
                recordKey={recordKey}
                unlocked={unlocked}
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
