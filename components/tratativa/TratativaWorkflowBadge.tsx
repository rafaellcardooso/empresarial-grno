import type { TratativaWorkflowStatus } from "@/lib/models/tratativa";
import { TRATATIVA_WORKFLOW_LABELS } from "@/lib/config/tratativa-workflow";

type TratativaWorkflowBadgeProps = {
  status?: TratativaWorkflowStatus;
};

/** Badge compacto com fase operacional da tratativa BSOD. */
export function TratativaWorkflowBadge({ status }: TratativaWorkflowBadgeProps) {
  if (!status || status === "em_tratativa") return null;

  const className =
    status === "acionado"
      ? "tratativa-workflow-badge tratativa-workflow-badge--acionado"
      : status === "validacao_pendente"
        ? "tratativa-workflow-badge tratativa-workflow-badge--pendente"
        : status === "validacao_reprovada"
          ? "tratativa-workflow-badge tratativa-workflow-badge--reprovada"
          : "tratativa-workflow-badge tratativa-workflow-badge--validado";

  return <span className={className}>{TRATATIVA_WORKFLOW_LABELS[status]}</span>;
}
