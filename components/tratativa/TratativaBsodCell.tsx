"use client";

import { useCallback, useState } from "react";
import { AcionamentoModal } from "@/components/tratativa/AcionamentoModal";
import { TratativaBsodWorkflow } from "@/components/tratativa/TratativaBsodWorkflow";
import { useSession } from "@/components/layout/SessionProvider";
import { TRATATIVA_WORKFLOW_LABELS } from "@/lib/config/tratativa-workflow";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type TratativaBsodCellProps = {
  recordKey: string;
  tratativa?: TratativaPublic | null;
  onChange: (next: TratativaPublic | null) => void;
};

/** Badge somente leitura do status operacional da tratativa BSOD. */
export function TratativaBsodStatusCell({ tratativa }: { tratativa?: TratativaPublic | null }) {
  if (!tratativa) {
    return (
      <span className="tratativa-workflow-badge tratativa-workflow-badge--pendente">
        Sem tratativa
      </span>
    );
  }

  const status = tratativa.workflowStatus ?? "em_tratativa";
  const className =
    status === "acionado"
      ? "tratativa-workflow-badge tratativa-workflow-badge--acionado"
      : status === "validacao_pendente"
        ? "tratativa-workflow-badge tratativa-workflow-badge--pendente"
        : status === "validacao_reprovada"
          ? "tratativa-workflow-badge tratativa-workflow-badge--reprovada"
          : status === "validado"
            ? "tratativa-workflow-badge tratativa-workflow-badge--validado"
            : "tratativa-workflow-badge tratativa-workflow-badge--em-tratativa";

  return <span className={className}>{TRATATIVA_WORKFLOW_LABELS[status]}</span>;
}

/** Controles de ação BSOD (Assumir, Acionar, Validar, Concluir, Liberar). */
export function TratativaBsodActionsCell({
  recordKey,
  tratativa,
  onChange,
}: TratativaBsodCellProps) {
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acionamentoOpen, setAcionamentoOpen] = useState(false);

  const normalizedKey = normalizeTratativaKey("BSOD", recordKey);
  const isMine = tratativa?.userId === user.id;
  const canManage = isMine || user.role === "STAFF";
  const workflowStatus = tratativa?.workflowStatus ?? "em_tratativa";
  const canRelease = canManage && workflowStatus === "em_tratativa";

  const handleAssume = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tratativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind: "BSOD", recordKey: normalizedKey }),
      });
      const payload = (await response.json()) as {
        tratativa?: TratativaPublic;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 409 && payload.tratativa) {
          onChange({ ...payload.tratativa, workflowStatus: "em_tratativa" });
        }
        setError(payload.error ?? UI_COPY.tratativaAssumeError);
        return;
      }

      if (payload.tratativa) {
        onChange({ ...payload.tratativa, workflowStatus: "em_tratativa" });
      }
    } catch {
      setError(UI_COPY.tratativaAssumeError);
    } finally {
      setBusy(false);
    }
  }, [normalizedKey, onChange]);

  const handleRelease = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tratativas/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind: "BSOD", recordKey: normalizedKey }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? UI_COPY.tratativaReleaseError);
        return;
      }

      onChange(null);
    } catch {
      setError(UI_COPY.tratativaReleaseError);
    } finally {
      setBusy(false);
    }
  }, [normalizedKey, onChange]);

  if (!normalizedKey) return "—";

  if (!tratativa) {
    return (
      <div className="tratativa-cell tratativa-cell--bsod">
        <button
          type="button"
          className="tratativa-assume-btn tratativa-assume-btn--bsod"
          onClick={handleAssume}
          disabled={busy}
        >
          <i className="bi bi-person-check" aria-hidden="true" />
          <span>{busy ? UI_COPY.tratativaBusy : UI_COPY.tratativaAssume}</span>
        </button>
        {error ? <span className="tratativa-cell__error">{error}</span> : null}
      </div>
    );
  }

  const ownerTitle = `${tratativa.userName} (${tratativa.userCorporateId}) — ${UI_COPY.tratativaSince} ${tratativa.startedAt}`;

  return (
    <>
      <div className="tratativa-cell tratativa-cell--bsod">
        <div className="tratativa-bsod-meta">
          <span className="tratativa-bsod-owner-name" title={ownerTitle}>
            {tratativa.userName}
          </span>
          <span className="tratativa-bsod-owner-meta">{tratativa.userCorporateId}</span>
        </div>
        <div className="tratativa-cell__toolbar">
          {canManage ? (
            <TratativaBsodWorkflow
              recordKey={normalizedKey}
              tratativa={tratativa}
              variant="default"
              busy={busy}
              onBusyChange={setBusy}
              onError={setError}
              onWorkflowChange={onChange}
              onAcionar={() => setAcionamentoOpen(true)}
            />
          ) : null}
          {canRelease ? (
            <button
              type="button"
              className="tratativa-release-btn tratativa-release-btn--bsod"
              onClick={handleRelease}
              disabled={busy}
            >
              {busy ? UI_COPY.tratativaBusy : UI_COPY.tratativaRelease}
            </button>
          ) : null}
        </div>
        {error ? <span className="tratativa-cell__error">{error}</span> : null}
      </div>

      <AcionamentoModal
        open={acionamentoOpen}
        recordKind="BSOD"
        recordKey={normalizedKey}
        onClose={() => setAcionamentoOpen(false)}
        onRegistered={() => onChange({ ...tratativa, workflowStatus: "acionado" })}
      />
    </>
  );
}

/** Célula BSOD combinando status e ações (inventário). */
export function TratativaBsodCell({ recordKey, tratativa, onChange }: TratativaBsodCellProps) {
  return (
    <div className="tratativa-cell tratativa-cell--bsod-combined">
      <TratativaBsodStatusCell tratativa={tratativa} />
      <TratativaBsodActionsCell recordKey={recordKey} tratativa={tratativa} onChange={onChange} />
    </div>
  );
}
