"use client";

import { useCallback, useEffect, useState } from "react";
import { OpenInSirButton } from "@/components/sir/OpenInSirButton";
import { AcionamentoModal } from "@/components/tratativa/AcionamentoModal";
import { SirConcludeFcaModal } from "@/components/tratativa/SirConcludeFcaModal";
import { SirPrepModal } from "@/components/tratativa/SirPrepModal";
import { TratativaBsodWorkflow } from "@/components/tratativa/TratativaBsodWorkflow";
import { TratativaWorkflowBadge } from "@/components/tratativa/TratativaWorkflowBadge";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { UI_COPY } from "@/lib/config/ui-copy";
import { TRATATIVA_WORKFLOW_LABELS } from "@/lib/config/tratativa-workflow";
import type { TratativaPublic } from "@/lib/models/tratativa";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
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

/** Painel lateral unificado de tratativa (SIR, BSOD WhatsApp, SDH). */
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
  const [concludeOpen, setConcludeOpen] = useState(false);
  const [acionamentoOpen, setAcionamentoOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);

  const isSirDomain = domain === "RAL" || domain === "REC";
  const isSdhDomain = domain === "SDH";
  const isAwaitingConclude = Boolean(session?.canConclude);
  const sirUnlocked = Boolean(session?.sirPortalUnlocked);
  const bsodWorkflowStatus =
    session?.workflowStatus ?? session?.tratativa?.workflowStatus ?? "em_tratativa";
  const bsodAfterAcionamento = session?.domain === "BSOD" && bsodWorkflowStatus !== "em_tratativa";
  const showBsodAcionamento =
    !isAwaitingConclude &&
    session?.canManage === true &&
    session?.domain === "BSOD" &&
    bsodWorkflowStatus === "em_tratativa";
  /** Validação BSOD só na fila de conclusão (modem já saiu de offline). */
  const showBsodWorkflow =
    isAwaitingConclude &&
    session?.canManage === true &&
    session?.domain === "BSOD" &&
    session.tratativa != null &&
    bsodAfterAcionamento &&
    bsodWorkflowStatus !== "validado";
  const showBsodFcaConclude =
    isAwaitingConclude &&
    session?.canManage === true &&
    session?.domain === "BSOD" &&
    (bsodWorkflowStatus === "validado" || bsodWorkflowStatus === "em_tratativa");
  const showSourceFcaConclude =
    isAwaitingConclude && session?.canManage === true && session?.domain !== "BSOD";
  const showInternalAcionamentoEntry =
    !isAwaitingConclude &&
    session?.canManage === true &&
    (session?.domain === "RAL" || session?.domain === "REC" || session?.domain === "SDH") &&
    !sirUnlocked;
  const showUpdateSection =
    !isAwaitingConclude &&
    (session?.domain === "BSOD"
      ? bsodAfterAcionamento
      : session?.domain === "RAL" || session?.domain === "REC" || session?.domain === "SDH"
        ? sirUnlocked
        : true);

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

  useEffect(() => {
    if (!open) {
      setConcludeOpen(false);
      setAcionamentoOpen(false);
      setPrepOpen(false);
    }
  }, [open]);

  const refreshAfterAction = useCallback(async () => {
    await loadSession();
    onChanged?.();
  }, [loadSession, onChanged]);

  const handleSaveObservation = useCallback(async () => {
    if (!session || !note.trim()) {
      setError(UI_COPY.tratativaUpdateEmpty);
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
          setError(payload.error ?? UI_COPY.tratativaUpdateError);
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
          setError(payload.error ?? UI_COPY.tratativaUpdateError);
          return;
        }
      }
      setNote("");
      await refreshAfterAction();
    } catch {
      setError(UI_COPY.tratativaUpdateError);
    } finally {
      setBusy(false);
    }
  }, [note, refreshAfterAction, session]);

  const handleRelease = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      if (session.domain === "SDH") {
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
      setError(UI_COPY.tratativaReleaseError);
    } finally {
      setBusy(false);
    }
  }, [note, onChanged, onClose, session]);

  const handleConcludeWithFca = useCallback(
    async (fca: ValidacaoFcaInput): Promise<string | null> => {
      if (!session) return UI_COPY.tratativaCloseError;
      setBusy(true);
      setError(null);
      try {
        const response = await apiFetch("/api/tratativas/concluir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordKind: session.domain,
            recordKey: session.recordKey,
            note: note.trim() || null,
            fca,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          return payload.error ?? UI_COPY.tratativaCloseError;
        }
        onChanged?.();
        onClose();
        return null;
      } catch {
        return UI_COPY.tratativaCloseError;
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
          <div className="d-flex align-items-center gap-2">
            {isSirDomain && !isAwaitingConclude ? (
              <OpenInSirButton
                domain={domain}
                numRecup={recordKey}
                locked={!sirUnlocked}
                lockedTitle={UI_COPY.sirOpenInPortalLocked}
              />
            ) : null}
            <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
          </div>
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
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <h3 className="h6 mb-0">Resumo</h3>
                  {session.tratativa || session.workflowStatus ? (
                    <TratativaWorkflowBadge
                      status={
                        session.workflowStatus ??
                        session.tratativa?.workflowStatus ??
                        "em_tratativa"
                      }
                    />
                  ) : null}
                </div>
                {showInternalAcionamentoEntry || showBsodAcionamento ? (
                  <div className="alert alert-warning py-2 small mb-3">
                    {TRATATIVA_WORKFLOW_LABELS.em_tratativa}. Use{" "}
                    <strong>{UI_COPY.acionamentoOpen}</strong> para registrar a visita técnica.
                  </div>
                ) : null}
                <dl className="tratativa-panel__summary">
                  {session.summary.map((item) => (
                    <div key={item.label} className="tratativa-panel__summary-item">
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {showSourceFcaConclude || showBsodFcaConclude ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">{UI_COPY.sirConcludeSectionTitle}</h3>
                  <p className="small text-body-secondary">
                    {isSdhDomain
                      ? UI_COPY.sdhConcludeSectionLead
                      : session.domain === "BSOD"
                        ? UI_COPY.bsodConcludeSectionLead
                        : UI_COPY.sirConcludeSectionLead}
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setConcludeOpen(true)}
                    disabled={busy}
                  >
                    {UI_COPY.tratativaConcluir}
                  </button>
                </section>
              ) : null}

              {showInternalAcionamentoEntry ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">{UI_COPY.acionamentoTitle}</h3>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPrepOpen(true)}
                      disabled={busy}
                    >
                      {UI_COPY.acionamentoOpen}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => void handleRelease()}
                      disabled={busy}
                    >
                      {UI_COPY.tratativaRelease}
                    </button>
                  </div>
                </section>
              ) : null}

              {showBsodAcionamento ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">{UI_COPY.acionamentoTitle}</h3>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setAcionamentoOpen(true)}
                      disabled={busy}
                    >
                      {UI_COPY.acionamentoOpen}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => void handleRelease()}
                      disabled={busy}
                    >
                      {UI_COPY.tratativaRelease}
                    </button>
                  </div>
                </section>
              ) : null}

              {showBsodWorkflow && session.tratativa ? (
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

              {showUpdateSection ? (
                <section className="tratativa-panel__section">
                  <h3 className="h6">{UI_COPY.tratativaUpdateTitle}</h3>
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={500}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    disabled={!session.canManage || busy}
                    placeholder={UI_COPY.tratativaUpdatePlaceholder}
                  />
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void handleSaveObservation()}
                      disabled={!session.canManage || busy}
                    >
                      {UI_COPY.tratativaUpdateSave}
                    </button>
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
      {session &&
      (session.domain === "RAL" ||
        session.domain === "REC" ||
        session.domain === "SDH" ||
        session.domain === "BSOD") ? (
        <SirConcludeFcaModal
          open={concludeOpen}
          recordKey={session.recordKey}
          onClose={() => setConcludeOpen(false)}
          onSubmit={handleConcludeWithFca}
        />
      ) : null}
      {session?.domain === "BSOD" ? (
        <AcionamentoModal
          open={acionamentoOpen}
          recordKind={session.domain}
          recordKey={session.recordKey}
          onClose={() => setAcionamentoOpen(false)}
          onRegistered={() => {
            setAcionamentoOpen(false);
            void refreshAfterAction();
          }}
        />
      ) : null}
      {session &&
      (session.domain === "RAL" || session.domain === "REC" || session.domain === "SDH") ? (
        <SirPrepModal
          open={prepOpen}
          recordKind={session.domain}
          recordKey={session.recordKey}
          unlocked={sirUnlocked}
          onClose={() => setPrepOpen(false)}
          onRegistered={() => {
            setPrepOpen(false);
            void refreshAfterAction();
          }}
        />
      ) : null}
    </>
  );
}
