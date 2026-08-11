"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcionamentoContextCard } from "@/components/tratativa/AcionamentoContextCard";
import { AcionamentoFormFields } from "@/components/tratativa/AcionamentoFormFields";
import {
  ACIONAMENTO_SCHEDULE_FIELDS,
  ACIONAMENTO_SINTOMA_FIELD,
  ACIONAMENTO_SINTOMA_FIELD_SIR,
  ACIONAMENTO_TECHNICIAN_FIELDS,
} from "@/lib/config/acionamento-form";
import { apiFetch } from "@/lib/config/base-path";
import { UI_COPY } from "@/lib/config/ui-copy";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import type {
  AcionamentoContext,
  AcionamentoRecordKind,
  AcionamentoTechnicianInput,
} from "@/lib/models/acionamento";
import { buildAcionamentoMessage } from "@/lib/tratativa/build-acionamento-message";
import {
  getAcionamentoTechnicianValidationError,
  isAcionamentoTechnicianComplete,
} from "@/lib/tratativa/validate-acionamento-technician";

type AcionamentoFormProps = {
  recordKind: AcionamentoRecordKind;
  recordKey: string;
  disabled?: boolean;
  onRegistered?: () => void;
};

const EMPTY_TECHNICIAN: AcionamentoTechnicianInput = {
  janela: "",
  nome: "",
  cidade: "",
  un: "",
  login: "",
  rg: "",
  cpf: "",
  sintoma: "",
};

/** Formulário embutível de acionamento WhatsApp. */
export function AcionamentoForm({
  recordKind,
  recordKey,
  disabled = false,
  onRegistered,
}: AcionamentoFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [copyWarning, setCopyWarning] = useState<string | null>(null);
  const [context, setContext] = useState<AcionamentoContext | null>(null);
  const [technician, setTechnician] = useState<AcionamentoTechnicianInput>(EMPTY_TECHNICIAN);

  const isSir = recordKind === "RAL" || recordKind === "REC";
  const sintomaField = isSir ? ACIONAMENTO_SINTOMA_FIELD_SIR : ACIONAMENTO_SINTOMA_FIELD;

  const previewMessage = useMemo(() => {
    if (!context || !isAcionamentoTechnicianComplete(technician)) return "";
    return buildAcionamentoMessage(context, technician);
  }, [context, technician]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCopyOk(false);
    setCopyWarning(null);
    setContext(null);
    setTechnician(EMPTY_TECHNICIAN);

    const params = new URLSearchParams({ kind: recordKind, key: recordKey });
    apiFetch(`/api/tratativas/acionamento/context?${params.toString()}`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          context?: AcionamentoContext;
          suggestedJanela?: string;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? UI_COPY.acionamentoLoadError);
        if (cancelled) return;
        setContext(payload.context ?? null);
        setTechnician({
          ...EMPTY_TECHNICIAN,
          janela: payload.suggestedJanela ?? "",
          sintoma: payload.context?.sintoma ?? "",
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : UI_COPY.acionamentoLoadError);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordKind, recordKey]);

  const updateField = useCallback((field: keyof AcionamentoTechnicianInput, value: string) => {
    setTechnician((current) => ({ ...current, [field]: value }));
    setCopyOk(false);
    setCopyWarning(null);
  }, []);

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
      const response = await apiFetch("/api/tratativas/acionamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind, recordKey, technician }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(payload.error ?? UI_COPY.acionamentoSubmitError);
        return;
      }
      onRegistered?.();
      const copied = await copyTextToClipboard(payload.message ?? previewMessage);
      if (copied) setCopyOk(true);
      else setCopyWarning(UI_COPY.acionamentoRegisteredCopyFailed);
    } catch {
      setError(UI_COPY.acionamentoSubmitError);
    } finally {
      setSubmitting(false);
    }
  }, [previewMessage, onRegistered, recordKey, recordKind, technician]);

  if (loading) return <p className="text-muted mb-0">{UI_COPY.acionamentoLoading}</p>;

  return (
    <div className="acionamento-embedded">
      {error ? <div className="alert alert-danger py-2 mb-3">{error}</div> : null}
      {copyWarning ? <div className="alert alert-warning py-2 mb-3">{copyWarning}</div> : null}
      {context ? (
        <>
          <AcionamentoContextCard context={context} />
          <section className="acionamento-form-section mt-3">
            <p className="acionamento-section-label">Agendamento</p>
            <AcionamentoFormFields
              fields={ACIONAMENTO_SCHEDULE_FIELDS}
              technician={technician}
              onChange={updateField}
            />
          </section>
          <section className="acionamento-form-section">
            <p className="acionamento-section-label">{UI_COPY.acionamentoTechnicianSection}</p>
            <AcionamentoFormFields
              fields={ACIONAMENTO_TECHNICIAN_FIELDS}
              technician={technician}
              onChange={updateField}
            />
          </section>
          <section className="acionamento-form-section">
            <p className="acionamento-section-label">Ocorrência</p>
            <AcionamentoFormFields
              fields={[sintomaField]}
              technician={technician}
              onChange={updateField}
            />
          </section>
          <p className="acionamento-section-label">{UI_COPY.acionamentoPreviewSection}</p>
          <pre className="acionamento-preview">
            {previewMessage || UI_COPY.acionamentoPreviewEmpty}
          </pre>
          <div className="d-flex align-items-center justify-content-end gap-2 mt-3">
            {copyOk ? (
              <span className="text-success small fw-semibold">{UI_COPY.acionamentoCopied}</span>
            ) : null}
            <button
              type="button"
              className="btn btn-success"
              onClick={() => void handleCopy()}
              disabled={disabled || submitting || !isAcionamentoTechnicianComplete(technician)}
            >
              <i className="bi bi-whatsapp me-1" aria-hidden="true" />
              {submitting ? UI_COPY.tratativaBusy : UI_COPY.acionamentoCopy}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
