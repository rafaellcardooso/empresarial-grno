"use client";

import { TratativaOperatorStack } from "@/components/tratativa/TratativaOperatorStack";
import {
  TRATATIVA_AWAITING_CONCLUSION_LABEL,
  TRATATIVA_BSOD_ACIONADO_LABEL,
  TRATATIVA_WORKFLOW_LABELS,
} from "@/lib/config/tratativa-workflow";
import type { TratativaPublic, TratativaWorkflowStatus } from "@/lib/models/tratativa";

type TratativaBsodStatusCellProps = {
  tratativa?: TratativaPublic | null;
  /** Modem já online (fila de pendentes de conclusão). */
  awaitingConclusion?: boolean;
};

/** Classe CSS do badge conforme a fase BSOD. */
function workflowBadgeClass(status: string): string {
  if (status === "acionado") return "tratativa-workflow-badge tratativa-workflow-badge--acionado";
  if (status === "validacao_pendente") {
    return "tratativa-workflow-badge tratativa-workflow-badge--pendente";
  }
  if (status === "validacao_reprovada") {
    return "tratativa-workflow-badge tratativa-workflow-badge--reprovada";
  }
  if (status === "validado" || status === "aguardando_conclusao") {
    return "tratativa-workflow-badge tratativa-workflow-badge--validado";
  }
  return "tratativa-workflow-badge tratativa-workflow-badge--em-tratativa";
}

/** Rótulo de fase BSOD (VT acionada / validação / conclusão). */
function bsodStatusLabel(status: TratativaWorkflowStatus, awaitingConclusion: boolean): string {
  if (awaitingConclusion && (status === "em_tratativa" || status === "validado")) {
    return TRATATIVA_AWAITING_CONCLUSION_LABEL;
  }
  if (status === "acionado") return TRATATIVA_BSOD_ACIONADO_LABEL;
  return TRATATIVA_WORKFLOW_LABELS[status];
}

/** Badge de status BSOD com nome e login do responsável. */
export function TratativaBsodStatusCell({
  tratativa,
  awaitingConclusion = false,
}: TratativaBsodStatusCellProps) {
  if (!tratativa) {
    return (
      <span className="tratativa-workflow-badge tratativa-workflow-badge--pendente">Pendente</span>
    );
  }

  const status = tratativa.workflowStatus ?? "em_tratativa";
  const label = bsodStatusLabel(status, awaitingConclusion);
  const badgeStatus =
    awaitingConclusion && (status === "em_tratativa" || status === "validado")
      ? "aguardando_conclusao"
      : status;

  return (
    <div className="tratativa-status-cell">
      <span className={workflowBadgeClass(badgeStatus)}>{label}</span>
      <TratativaOperatorStack name={tratativa.userName} corporateId={tratativa.userCorporateId} />
    </div>
  );
}
