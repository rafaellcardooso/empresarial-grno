"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcionamentoContextCard } from "@/components/tratativa/AcionamentoContextCard";
import { AcionamentoFormFields } from "@/components/tratativa/AcionamentoFormFields";
import {
  ACIONAMENTO_SCHEDULE_FIELDS,
  ACIONAMENTO_SINTOMA_FIELD,
  ACIONAMENTO_SINTOMA_FIELD_SIR,
  ACIONAMENTO_TECHNICIAN_FIELDS,
  ACIONAMENTO_WHATSAPP_MENTION_FIELD,
} from "@/lib/config/acionamento-form";
import { UI_COPY } from "@/lib/config/ui-copy";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import type { AcionamentoContext, AcionamentoTechnicianInput } from "@/lib/models/acionamento";
import type { TratativaRecordKind } from "@/lib/models/tratativa";
import { buildAcionamentoMessage } from "@/lib/tratativa/build-acionamento-message";
import {
  getAcionamentoTechnicianValidationError,
  isAcionamentoTechnicianComplete,
} from "@/lib/tratativa/validate-acionamento-technician";

type AcionamentoModalProps = {
  open: boolean;
  recordKind: TratativaRecordKind;
  recordKey: string;
  onClose: () => void;
  onRegistered?: () => void;
};

const EMPTY_TECHNICIAN: AcionamentoTechnicianInput = {
  whatsappTarget: "",
  janela: "",
  nome: "",
  cidade: "",
  un: "",
  login: "",
  rg: "",
  cpf: "",
  sintoma: "",
};

/** Modal para montar e copiar mensagem de acionamento WhatsApp (BSOD, RAL ou REC). */
export function AcionamentoModal({
  open,
  recordKind,
  recordKey,
  onClose,
  onRegistered,
}: AcionamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [copyWarning, setCopyWarning] = useState<string | null>(null);
  const [context, setContext] = useState<AcionamentoContext | null>(null);
  const [technician, setTechnician] = useState<AcionamentoTechnicianInput>(EMPTY_TECHNICIAN);

  const isSir = recordKind === "RAL" || recordKind === "REC";
  const sintomaField = isSir ? ACIONAMENTO_SINTOMA_FIELD_SIR : ACIONAMENTO_SINTOMA_FIELD;
  const scheduleFields = isSir
    ? [...ACIONAMENTO_SCHEDULE_FIELDS, ACIONAMENTO_WHATSAPP_MENTION_FIELD]
    : ACIONAMENTO_SCHEDULE_FIELDS;

  const previewMessage = useMemo(() => {
    if (!context || !isAcionamentoTechnicianComplete(technician)) return "";
    return buildAcionamentoMessage(context, technician);
  }, [context, technician]);

  /** Carrega contexto do registro ao abrir modal. */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCopyOk(false);
    setCopyWarning(null);
    setContext(null);
    setTechnician(EMPTY_TECHNICIAN);

    const params = new URLSearchParams({
      kind: recordKind,
      key: recordKey,
    });

    fetch(`/api/tratativas/acionamento/context?${params.toString()}`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          context?: AcionamentoContext;
          suggestedJanela?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? UI_COPY.acionamentoLoadError);
        }
        if (cancelled) return;
        setContext(payload.context ?? null);
        setTechnician({
          ...EMPTY_TECHNICIAN,
          janela: payload.suggestedJanela ?? "",
          sintoma: payload.context?.sintoma ?? "",
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : UI_COPY.acionamentoLoadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, recordKey, recordKind]);

  const updateField = useCallback((field: keyof AcionamentoTechnicianInput, value: string) => {
    setTechnician((current) => ({ ...current, [field]: value }));
    setCopyOk(false);
    setCopyWarning(null);
  }, []);

  /** Registra acionamento e copia mensagem para área de transferência. */
  const handleCopy = useCallback(async () => {
    const validationError = getAcionamentoTechnicianValidationError(technician);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setCopyOk(false);
    setCopyWarning(null);

    try {
      const response = await fetch("/api/tratativas/acionamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind, recordKey, technician }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(payload.error ?? UI_COPY.acionamentoSubmitError);
        return;
      }

      const message = payload.message ?? previewMessage;
      onRegistered?.();

      const copied = await copyTextToClipboard(message);
      if (copied) {
        setCopyOk(true);
      } else {
        setCopyWarning(UI_COPY.acionamentoRegisteredCopyFailed);
      }
    } catch {
      setError(UI_COPY.acionamentoSubmitError);
    } finally {
      setSubmitting(false);
    }
  }, [recordKind, recordKey, technician, previewMessage, onRegistered]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const missingAddress =
    context?.recordKind === "BSOD"
      ? !context.address?.trim()
      : context?.recordKind === "RAL" || context?.recordKind === "REC"
        ? !context.endereco?.trim()
        : false;

  return (
    <>
      <div
        className="modal fade show d-block acionamento-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="acionamento-modal-title"
      >
        <div className="modal-dialog modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header acionamento-modal__header">
              <div>
                <p className="acionamento-modal__eyebrow mb-1">{UI_COPY.acionamentoTitle}</p>
                <h2 className="modal-title h5 mb-0" id="acionamento-modal-title">
                  {recordKind} · {recordKey}
                </h2>
              </div>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              {loading ? <p className="text-muted mb-0">{UI_COPY.acionamentoLoading}</p> : null}
              {error ? <div className="alert alert-danger py-2 mb-3">{error}</div> : null}
              {copyWarning ? (
                <div className="alert alert-warning py-2 mb-3">{copyWarning}</div>
              ) : null}

              {!loading && context ? (
                <div className="row g-4">
                  <div className="col-lg-5">
                    <section className="acionamento-form-section">
                      <p className="acionamento-section-label">Agendamento</p>
                      <AcionamentoFormFields
                        fields={scheduleFields}
                        technician={technician}
                        onChange={updateField}
                      />
                    </section>

                    <section className="acionamento-form-section">
                      <p className="acionamento-section-label">
                        {UI_COPY.acionamentoTechnicianSection}
                      </p>
                      <AcionamentoFormFields
                        fields={ACIONAMENTO_TECHNICIAN_FIELDS}
                        technician={technician}
                        onChange={updateField}
                      />
                    </section>

                    <section className="acionamento-form-section mb-0">
                      <p className="acionamento-section-label">Ocorrência</p>
                      <AcionamentoFormFields
                        fields={[sintomaField]}
                        technician={technician}
                        onChange={updateField}
                      />
                    </section>
                  </div>

                  <div className="col-lg-7">
                    <AcionamentoContextCard context={context} />
                    <p className="acionamento-section-label mt-3">
                      {UI_COPY.acionamentoPreviewSection}
                    </p>
                    <pre className="acionamento-preview">
                      {previewMessage || UI_COPY.acionamentoPreviewEmpty}
                    </pre>
                    {missingAddress ? (
                      <p className="acionamento-hint">{UI_COPY.acionamentoMissingAddress}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer justify-content-between acionamento-modal__footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {UI_COPY.acionamentoClose}
              </button>
              <div className="d-flex align-items-center gap-2">
                {copyOk ? (
                  <span className="text-success small fw-semibold">
                    {UI_COPY.acionamentoCopied}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopy}
                  disabled={submitting || loading || !isAcionamentoTechnicianComplete(technician)}
                >
                  {submitting ? UI_COPY.tratativaBusy : UI_COPY.acionamentoCopy}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}
