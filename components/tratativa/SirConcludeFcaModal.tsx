"use client";

import { useCallback, useEffect, useState } from "react";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import {
  getValidacaoFcaValidationError,
  isValidacaoFcaComplete,
} from "@/lib/tratativa/validate-validacao-fca";

type SirConcludeFcaModalProps = {
  open: boolean;
  recordKey: string;
  onClose: () => void;
  onSubmit: (fca: ValidacaoFcaInput) => Promise<string | null>;
};

const EMPTY_FCA: ValidacaoFcaInput = { fato: "", causa: "", acao: "" };

/** Modal para concluir tratativa SIR com FCA obrigatório. */
export function SirConcludeFcaModal({
  open,
  recordKey,
  onClose,
  onSubmit,
}: SirConcludeFcaModalProps) {
  const [fca, setFca] = useState<ValidacaoFcaInput>(EMPTY_FCA);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
    const submitError = await onSubmit(fca);
    setBusy(false);
    if (!submitError) onClose();
    else setError(submitError);
  }, [fca, onClose, onSubmit]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block validacao-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sir-conclude-fca-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="sir-conclude-fca-title">
                {UI_COPY.sirConcludeFcaTitle}
              </h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="text-body-secondary small mb-3">
                {UI_COPY.sirConcludeFcaHint} <strong>{recordKey}</strong>
              </p>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              <div className="mb-3">
                <label className="form-label acionamento-field-label" htmlFor="sir-conclude-fato">
                  {UI_COPY.tratativaValidacaoFato}
                </label>
                <textarea
                  id="sir-conclude-fato"
                  className="form-control form-control-sm"
                  rows={2}
                  value={fca.fato}
                  placeholder={UI_COPY.tratativaValidacaoFatoPlaceholder}
                  onChange={(event) => updateFca("fato", event.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label acionamento-field-label" htmlFor="sir-conclude-causa">
                  {UI_COPY.tratativaValidacaoCausa}
                </label>
                <textarea
                  id="sir-conclude-causa"
                  className="form-control form-control-sm"
                  rows={2}
                  value={fca.causa}
                  placeholder={UI_COPY.tratativaValidacaoCausaPlaceholder}
                  onChange={(event) => updateFca("causa", event.target.value)}
                />
              </div>
              <div>
                <label className="form-label acionamento-field-label" htmlFor="sir-conclude-acao">
                  {UI_COPY.tratativaValidacaoAcao}
                </label>
                <textarea
                  id="sir-conclude-acao"
                  className="form-control form-control-sm"
                  rows={2}
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
                className="btn btn-danger"
                onClick={() => void handleSubmit()}
                disabled={!isValidacaoFcaComplete(fca) || busy}
              >
                {busy ? UI_COPY.tratativaBusy : UI_COPY.tratativaConcluir}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}
