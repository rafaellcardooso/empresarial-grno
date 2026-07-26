"use client";

import { useCallback, useState } from "react";
import { VALIDACAO_OUTCOME_OPTIONS, type ValidacaoOutcome } from "@/lib/config/tratativa-workflow";
import { UI_COPY } from "@/lib/config/ui-copy";

type ValidacaoModalProps = {
  open: boolean;
  recordKey: string;
  onClose: () => void;
  onSubmit: (outcome: ValidacaoOutcome, note: string) => Promise<boolean>;
};

/** Modal para registrar validação pós-VT (aprovada ou reprovada). */
export function ValidacaoModal({ open, recordKey, onClose, onSubmit }: ValidacaoModalProps) {
  const [outcome, setOutcome] = useState<ValidacaoOutcome>("aprovada");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setBusy(true);
    setError(null);
    const ok = await onSubmit(outcome, note);
    setBusy(false);
    if (ok) {
      setNote("");
      setOutcome("aprovada");
      onClose();
    } else {
      setError(UI_COPY.tratativaValidacaoError);
    }
  }, [note, onClose, onSubmit, outcome]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block validacao-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="validacao-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="validacao-modal-title">
                {UI_COPY.tratativaValidacaoTitle}
              </h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="text-body-secondary small mb-3">
                {UI_COPY.tratativaValidacaoHint} <strong>{recordKey}</strong>
              </p>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              <div className="mb-3">
                <span className="form-label d-block acionamento-field-label mb-2">
                  {UI_COPY.tratativaValidacaoOutcome}
                </span>
                <div className="d-flex flex-wrap gap-2">
                  {VALIDACAO_OUTCOME_OPTIONS.map((option) => (
                    <label key={option.value} className="validacao-outcome-option">
                      <input
                        type="radio"
                        name="validacao-outcome"
                        value={option.value}
                        checked={outcome === option.value}
                        onChange={() => setOutcome(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label acionamento-field-label" htmlFor="validacao-note">
                  {UI_COPY.tratativaValidacaoNote}
                </label>
                <textarea
                  id="validacao-note"
                  className="form-control form-control-sm"
                  rows={3}
                  value={note}
                  placeholder={UI_COPY.tratativaValidacaoNotePlaceholder}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {UI_COPY.acionamentoClose}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={busy}
              >
                {busy ? UI_COPY.tratativaBusy : UI_COPY.tratativaValidacaoSave}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}
