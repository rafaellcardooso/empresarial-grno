"use client";

import { useCallback, useEffect, useState } from "react";
import { VALIDACAO_OUTCOME_OPTIONS, type ValidacaoOutcome } from "@/lib/config/tratativa-workflow";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import {
  getValidacaoFcaValidationError,
  isValidacaoFcaComplete,
} from "@/lib/tratativa/validate-validacao-fca";

type ValidacaoModalProps = {
  open: boolean;
  recordKey: string;
  onClose: () => void;
  onSubmit: (outcome: ValidacaoOutcome, fca: ValidacaoFcaInput) => Promise<string | null>;
};

const EMPTY_FCA: ValidacaoFcaInput = {
  fato: "",
  causa: "",
  acao: "",
};

/** Modal para registrar validação pós-VT com FCA (fato, causa e ação). */
export function ValidacaoModal({ open, recordKey, onClose, onSubmit }: ValidacaoModalProps) {
  const [outcome, setOutcome] = useState<ValidacaoOutcome>("aprovada");
  const [fca, setFca] = useState<ValidacaoFcaInput>(EMPTY_FCA);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOutcome("aprovada");
    setFca(EMPTY_FCA);
    setError(null);
    setBusy(false);
  }, [open]);

  const updateFca = useCallback((field: keyof ValidacaoFcaInput, value: string) => {
    setFca((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationError = getValidacaoFcaValidationError(fca);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    const submitError = await onSubmit(outcome, fca);
    setBusy(false);
    if (!submitError) {
      onClose();
    } else {
      setError(submitError);
    }
  }, [fca, onClose, onSubmit, outcome]);

  if (!open) return null;

  const canSubmit = isValidacaoFcaComplete(fca) && !busy;

  return (
    <>
      <div
        className="modal fade show d-block validacao-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="validacao-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
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

              <p className="acionamento-section-label mb-2">
                {UI_COPY.tratativaValidacaoFcaSection}
              </p>
              <div className="mb-3">
                <label className="form-label acionamento-field-label" htmlFor="validacao-fato">
                  {UI_COPY.tratativaValidacaoFato}
                </label>
                <textarea
                  id="validacao-fato"
                  className="form-control form-control-sm"
                  rows={2}
                  required
                  value={fca.fato}
                  placeholder={UI_COPY.tratativaValidacaoFatoPlaceholder}
                  onChange={(event) => updateFca("fato", event.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label acionamento-field-label" htmlFor="validacao-causa">
                  {UI_COPY.tratativaValidacaoCausa}
                </label>
                <textarea
                  id="validacao-causa"
                  className="form-control form-control-sm"
                  rows={2}
                  required
                  value={fca.causa}
                  placeholder={UI_COPY.tratativaValidacaoCausaPlaceholder}
                  onChange={(event) => updateFca("causa", event.target.value)}
                />
              </div>
              <div>
                <label className="form-label acionamento-field-label" htmlFor="validacao-acao">
                  {UI_COPY.tratativaValidacaoAcao}
                </label>
                <textarea
                  id="validacao-acao"
                  className="form-control form-control-sm"
                  rows={2}
                  required
                  value={fca.acao}
                  placeholder={UI_COPY.tratativaValidacaoAcaoPlaceholder}
                  onChange={(event) => updateFca("acao", event.target.value)}
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
                disabled={!canSubmit}
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
