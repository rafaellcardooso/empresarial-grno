import type { TratativaWorkflowStatus } from "@/lib/models/tratativa";

/** Rótulos UI do status operacional da tratativa BSOD. */
export const TRATATIVA_WORKFLOW_LABELS: Record<TratativaWorkflowStatus, string> = {
  em_tratativa: "Em tratativa",
  acionado: "VT acionada",
  validacao_pendente: "Validar sinal",
  validacao_reprovada: "Reprovada",
  validado: "Validado",
};

/** Resultado registrado na validação pós-VT. */
export type ValidacaoOutcome = "aprovada" | "reprovada";

/** Extrai o resultado gravado no campo note do evento VALIDACAO. */
export function parseValidacaoOutcomeFromNote(note: string | null | undefined): ValidacaoOutcome {
  const normalized = (note ?? "").trim().toLowerCase();
  if (normalized.startsWith("reprovada")) return "reprovada";
  return "aprovada";
}

/** Mapeia resultado da validação para fase operacional da tratativa. */
export function workflowStatusFromValidacaoOutcome(
  outcome: ValidacaoOutcome,
): TratativaWorkflowStatus {
  return outcome === "aprovada" ? "validado" : "validacao_reprovada";
}

/** Opções do formulário de validação. */
export const VALIDACAO_OUTCOME_OPTIONS: Array<{ value: ValidacaoOutcome; label: string }> = [
  { value: "aprovada", label: "Aprovada" },
  { value: "reprovada", label: "Reprovada" },
];
