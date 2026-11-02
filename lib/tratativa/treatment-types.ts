import type { AcionamentoRecordKind } from "@/lib/models/acionamento";
import type { TratativaHistoryEntry, TratativaPublic } from "@/lib/models/tratativa";
import type { SdhAlarmListItem } from "@/lib/models/sdh";

/** Domínios cobertos pelo painel unificado de tratativa. */
export type TreatmentDomain = AcionamentoRecordKind;

/** Payload público do painel de tratativa. */
export type TreatmentSession = {
  domain: TreatmentDomain;
  recordKey: string;
  title: string;
  subtitle?: string;
  summary: Array<{ label: string; value: string }>;
  canManage: boolean;
  readOnlyReason?: string;
  tratativa?: TratativaPublic | null;
  sdhAlarm?: SdhAlarmListItem | null;
  history: TratativaHistoryEntry[];
  workflowStatus?: string;
  canConclude?: boolean;
  /**
   * Preparação registrada (evento ACIONAMENTO).
   * Em RAL/REC libera Abrir no SIR; em SDH só indica preparação concluída.
   */
  sirPortalUnlocked?: boolean;
};

/** Rótulos de eventos para cronologia. */
export const TREATMENT_EVENT_LABELS: Record<string, string> = {
  START: "Tratativa iniciada",
  RELEASE: "Tratativa liberada",
  ACIONAMENTO: "Acionamento registrado",
  OBSERVACAO: "Observação",
  VALIDACAO_SOLICITADA: "Validação solicitada",
  VALIDACAO: "Validação registrada",
  CONCLUIDA: "Tratativa concluída",
  UPDATE: "Atualização (legado)",
  CLOSE: "Encerramento",
};

/**
 * Indica se há ACIONAMENTO no ciclo atual (após o último START).
 * Evita liberar o fluxo com acionamento de tratativas anteriores no mesmo registro.
 */
export function hasAcionamentoInCurrentCycle(history: TratativaHistoryEntry[]): boolean {
  let cycleStart = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.eventType === "START") {
      cycleStart = index;
      break;
    }
  }
  return history.slice(cycleStart).some((entry) => entry.eventType === "ACIONAMENTO");
}
