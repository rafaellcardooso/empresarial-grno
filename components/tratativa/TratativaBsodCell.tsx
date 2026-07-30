"use client";

import { TRATATIVA_WORKFLOW_LABELS } from "@/lib/config/tratativa-workflow";
import type { TratativaPublic } from "@/lib/models/tratativa";

/** Badge somente leitura do status operacional da tratativa BSOD. */
export function TratativaBsodStatusCell({ tratativa }: { tratativa?: TratativaPublic | null }) {
  if (!tratativa) {
    return (
      <span className="tratativa-workflow-badge tratativa-workflow-badge--pendente">Pendente</span>
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
