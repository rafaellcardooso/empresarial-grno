"use client";

import { useCallback, useState } from "react";
import { ValidacaoModal } from "@/components/tratativa/ValidacaoModal";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic, TratativaWorkflowStatus } from "@/lib/models/tratativa";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import type { ValidacaoOutcome } from "@/lib/config/tratativa-workflow";
import { apiFetch } from "@/lib/config/base-path";

type TratativaBsodWorkflowProps = {
  recordKey: string;
  tratativa: TratativaPublic;
  variant: "default" | "compact";
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
  onWorkflowChange: (next: TratativaPublic | null) => void;
  onAcionar?: () => void;
  /** Oculta o botão WhatsApp quando o formulário já está no painel. */
  hideAcionar?: boolean;
};

/** Ações BSOD pós-assunção: acionar, validação e conclusão. */
export function TratativaBsodWorkflow({
  recordKey,
  tratativa,
  variant,
  busy,
  onBusyChange,
  onError,
  onWorkflowChange,
  onAcionar,
  hideAcionar = false,
}: TratativaBsodWorkflowProps) {
  const [validacaoOpen, setValidacaoOpen] = useState(false);
  const status: TratativaWorkflowStatus = tratativa.workflowStatus ?? "em_tratativa";

  const postWorkflow = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      onBusyChange(true);
      onError(null);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordKind: "BSOD", recordKey, ...body }),
        });
        const payload = (await response.json()) as {
          error?: string;
          workflowStatus?: TratativaWorkflowStatus;
        };
        if (!response.ok) {
          onError(payload.error ?? UI_COPY.tratativaWorkflowError);
          return false;
        }
        if (payload.workflowStatus) {
          onWorkflowChange({ ...tratativa, workflowStatus: payload.workflowStatus });
        }
        return true;
      } catch {
        onError(UI_COPY.tratativaWorkflowError);
        return false;
      } finally {
        onBusyChange(false);
      }
    },
    [onBusyChange, onError, onWorkflowChange, recordKey, tratativa],
  );

  const handleRequestValidacao = useCallback(async () => {
    await postWorkflow("/api/tratativas/validacao/solicitar", {});
  }, [postWorkflow]);

  const handleConcluir = useCallback(async () => {
    const ok = await postWorkflow("/api/tratativas/concluir", {});
    if (ok) onWorkflowChange(null);
  }, [onWorkflowChange, postWorkflow]);

  const acionarClass =
    variant === "compact"
      ? "tratativa-acionar-btn tratativa-acionar-btn--compact"
      : "tratativa-acionar-btn";
  const actionClass =
    variant === "compact"
      ? "tratativa-action-btn tratativa-action-btn--compact"
      : "tratativa-action-btn";

  return (
    <>
      {status === "em_tratativa" && !hideAcionar && onAcionar ? (
        <button
          type="button"
          className={acionarClass}
          onClick={onAcionar}
          title={UI_COPY.acionamentoOpen}
          aria-label={UI_COPY.acionamentoOpen}
        >
          <i className="bi bi-whatsapp" aria-hidden="true" />
          {variant === "compact" ? null : <span>{UI_COPY.acionamentoOpen}</span>}
        </button>
      ) : null}

      {status === "acionado" || status === "validacao_reprovada" ? (
        <button
          type="button"
          className={actionClass}
          onClick={handleRequestValidacao}
          disabled={busy}
          title={UI_COPY.tratativaRequestValidacao}
          aria-label={UI_COPY.tratativaRequestValidacao}
        >
          <i className="bi bi-clipboard-check" aria-hidden="true" />
          {variant === "compact" ? null : <span>{UI_COPY.tratativaRequestValidacao}</span>}
        </button>
      ) : null}

      {status === "validacao_pendente" ? (
        <button
          type="button"
          className={actionClass}
          onClick={() => setValidacaoOpen(true)}
          disabled={busy}
          title={UI_COPY.tratativaRegisterValidacao}
          aria-label={UI_COPY.tratativaRegisterValidacao}
        >
          <i className="bi bi-check2-square" aria-hidden="true" />
          {variant === "compact" ? null : <span>{UI_COPY.tratativaRegisterValidacao}</span>}
        </button>
      ) : null}

      {status === "validado" ? (
        <button
          type="button"
          className={`${actionClass} tratativa-action-btn--concluir`}
          onClick={handleConcluir}
          disabled={busy}
          title={UI_COPY.tratativaConcluir}
          aria-label={UI_COPY.tratativaConcluir}
        >
          <i className="bi bi-flag-fill" aria-hidden="true" />
          {variant === "compact" ? null : <span>{UI_COPY.tratativaConcluir}</span>}
        </button>
      ) : null}

      <ValidacaoModal
        open={validacaoOpen}
        recordKey={recordKey}
        onClose={() => setValidacaoOpen(false)}
        onSubmit={async (outcome: ValidacaoOutcome, fca: ValidacaoFcaInput) => {
          onBusyChange(true);
          onError(null);
          try {
            const response = await apiFetch("/api/tratativas/validacao", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recordKind: "BSOD", recordKey, outcome, fca }),
            });
            const payload = (await response.json()) as {
              error?: string;
              workflowStatus?: TratativaWorkflowStatus;
            };
            if (!response.ok) {
              const message = payload.error ?? UI_COPY.tratativaValidacaoError;
              onError(message);
              return message;
            }
            if (payload.workflowStatus) {
              onWorkflowChange({ ...tratativa, workflowStatus: payload.workflowStatus });
            }
            return null;
          } catch {
            onError(UI_COPY.tratativaValidacaoError);
            return UI_COPY.tratativaValidacaoError;
          } finally {
            onBusyChange(false);
          }
        }}
      />
    </>
  );
}
