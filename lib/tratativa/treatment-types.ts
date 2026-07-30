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
