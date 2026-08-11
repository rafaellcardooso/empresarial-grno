"use client";

import { useCallback, useEffect, useState } from "react";
import { AcionamentoForm } from "@/components/tratativa/AcionamentoForm";
import { TratativaBsodWorkflow } from "@/components/tratativa/TratativaBsodWorkflow";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import type { TreatmentDomain, TreatmentSession } from "@/lib/tratativa/treatment-types";
import { TREATMENT_EVENT_LABELS } from "@/lib/tratativa/treatment-types";
import { apiFetch } from "@/lib/config/base-path";

type TratativaPanelProps = {
  open: boolean;
  domain: TreatmentDomain | null;
  recordKey: string | null;
  onClose: () => void;
  onChanged?: () => void;
};

/** Painel lateral unificado de tratativa com observação, WhatsApp e cronologia. */
export function TratativaPanel({
  open,
  domain,
  recordKey,
  onClose,
  onChanged,
}: TratativaPanelProps) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [session, setSession] = useState<TreatmentSession | null>(null);

  const loadSession = useCallback(async () => {
    if (!domain || !recordKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/tratativas/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, recordKey }),
      });
      const payload = (await response.json()) as {
        treatment?: TreatmentSession;
        error?: string;
      };
      if (!response.ok || !payload.treatment) {
        setError(payload.error ?? "Não foi possível abrir a tratativa.");
        setSession(null);
        return;
      }
      setSession(payload.treatment);
      setNote("");
    } catch {
      setError("Não foi possível abrir a tratativa.");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [domain, recordKey]);

  useEffect(() => {
    if (!open) return;
    void loadSession();
  }, [loadSession, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const refreshAfterAction = useCallback(async () => {
    await loadSession();
    onChanged?.();
  }, [loadSession, onChanged]);

  const handleSaveObservation = useCallback(async () => {
    if (!session || !note.trim()) {
      setError("Informe a observação.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (session.domain === "SDH") {
        const response = await apiFetch(`/api/sdh/${session.recordKey}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emTratativa: true, observacao: note.trim() }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Falha ao salvar observação.");
          return;
        }
      } else {
        const response = await apiFetch("/api/tratativas/observacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordKind: session.domain,
            recordKey: session.recordKey,
            note: note.trim(),
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Falha ao salvar observação.");
          return;
        }
      }
      setNote("");
      await refreshAfterAction();
    } catch {
      setError("Falha ao salvar observação.");
    } finally {
      setBusy(false);
    }
  }, [note, refreshAfterAction, session]);

  const handleEndTreatment = useCallback(
    async (action: "release" | "conclude") => {
      if (!session) return;
      if (action === "conclude" && !note.trim()) {
        setError("Informe a observação de encerramento.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        if (action === "conclude") {
          const response = await apiFetch("/api/tratativas/concluir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordKind: session.domain,
              recordKey: session.recordKey,
              note: note.trim(),
            }),
          });
          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error ?? UI_COPY.tratativaCloseError);
            return;
          }
        } else if (session.domain === "SDH") {
          const observacao = note.trim() || "Encerramento via painel Tratar.";
          const response = await apiFetch(`/api/sdh/${session.recordKey}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emTratativa: false, observacao }),
          });
          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error ?? UI_COPY.tratativaReleaseError);
            return;
          }
        } else {
          const response = await apiFetch("/api/tratativas/release", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordKind: session.domain,
              recordKey: session.recordKey,
            }),
          });
          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error ?? UI_COPY.tratativaReleaseError);
            return;
          }
        }
        onChanged?.();
        onClose();
      } catch {
        setError(
          action === "conclude" ? UI_COPY.tratativaCloseError : UI_COPY.tratativaReleaseError,
        );
      } finally {
        setBusy(false);
      }
    },
    [note, onChanged, onClose, session],
  );

  if (!open) return null;

  return (
    <>
      <div
        className="offcanvas offcanvas-end show tratativa-panel"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tratativa-panel-title"
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">Tratar</p>
            <h2 className="offcanvas-title h5 mb-0" id="tratativa-panel-title">
              {session?.title ?? `${domain ?? ""} · ${recordKey ?? ""}`}
            </h2>
            {session?.subtitle ? (
              <p className="small text-body-secondary mb-0 mt-1">{session.subtitle}</p>
            ) : null}
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>

        <div className="offcanvas-body">
          {loading ? <p className="text-muted">Abrindo tratativa…</p> : null}
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          {session?.readOnlyReason ? (
            <div className="alert alert-warning py-2">{session.readOnlyReason}</div>
          ) : null}

          {session ? (
            <>
              <section className="tratativa-panel__section">
                <h3 className="h6">Resumo</h3>
                <dl className="tratativa-panel__summary">
                  {session.summary.map((item) => (
                    <div key={item.label} className="tratativa-panel__summary-item">
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="tratativa-panel__section">
                <h3 className="h6">Observação</h3>
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={!session.canManage || busy}
                  placeholder="Registre a atualização operacional"
                />
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void handleSaveObservation()}
                    disabled={!session.canManage || busy}
                  >
                    Salvar observação
                  </button>
                  {session.canManage ? (
                    <>
                      {session.canConclude ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => void handleEndTreatment("conclude")}
                          disabled={busy || !note.trim()}
                        >
                          {UI_COPY.tratativaClose}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => void handleEndTreatment("release")}
                        disabled={busy}
                      >
                        {session.domain === "SDH" ? "Encerrar" : UI_COPY.tratativaRelease}
                      </button>
                    </>
                  ) : null}
                </div>
              </section>

              {session.canManage ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">Acionamento WhatsApp</h3>
                  <AcionamentoForm
                    recordKind={session.domain}
                    recordKey={session.recordKey}
                    disabled={busy}
                    onRegistered={() => void refreshAfterAction()}
                  />
                </section>
              ) : null}

              {session.domain === "BSOD" && session.canManage && session.tratativa ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">Fluxo BSOD</h3>
                  <div className="d-flex flex-wrap gap-2">
                    <TratativaBsodWorkflow
                      recordKey={session.recordKey}
                      tratativa={session.tratativa}
                      variant="default"
                      busy={busy}
                      onBusyChange={setBusy}
                      onError={setError}
                      hideAcionar
                      onWorkflowChange={(next: TratativaPublic | null) => {
                        if (!next) {
                          onChanged?.();
                          onClose();
                          return;
                        }
                        void refreshAfterAction();
                      }}
                    />
                  </div>
                </section>
              ) : null}

              <section className="tratativa-panel__section">
                <h3 className="h6">Cronologia</h3>
                {session.history.length === 0 ? (
                  <p className="small text-body-secondary mb-0">Nenhum evento registrado.</p>
                ) : (
                  <div className="list-group">
                    {[...session.history].reverse().map((entry, index) => (
                      <div key={`${entry.createdAt}-${index}`} className="list-group-item">
                        <div className="d-flex justify-content-between gap-2 small">
                          <strong>
                            {TREATMENT_EVENT_LABELS[entry.eventType] ?? entry.eventType}
                          </strong>
                          <span className="text-body-secondary">
                            {formatDateTimePtBr(entry.createdAt)}
                          </span>
                        </div>
                        <p className="mb-0 mt-1 small">
                          {entry.userName}
                          {entry.note?.trim() ? ` · ${entry.note.trim()}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
      <div
        className="offcanvas-backdrop fade show sir-detalhes-offcanvas-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
    </>
  );
}
