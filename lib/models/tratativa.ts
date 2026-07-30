/** Tipo de registro coberto por tratativa. */
export type TratativaRecordKind = "RAL" | "REC" | "BSOD";

/** Evento de auditoria de tratativa. */
export type TratativaEventType =
  | "START"
  | "RELEASE"
  | "ACIONAMENTO"
  | "OBSERVACAO"
  | "VALIDACAO_SOLICITADA"
  | "VALIDACAO"
  | "CONCLUIDA";

/** Fase operacional da tratativa BSOD (pós-acionamento). */
export type TratativaWorkflowStatus =
  "em_tratativa" | "acionado" | "validacao_pendente" | "validacao_reprovada" | "validado";

/** Entrada cronológica exibida na coluna de observação. */
export type TratativaHistoryEntry = {
  eventType: string;
  note: string | null;
  userName: string;
  createdAt: string;
};

/** Linha ativa em app_tratativas com dados do responsável. */
export type ActiveTratativaRecord = {
  id: number;
  record_kind: TratativaRecordKind;
  record_key: string;
  user_id: number;
  user_name: string;
  user_corporate_id: string;
  note: string | null;
  started_at: Date;
};

/** Tratativa ativa serializada para API/UI. */
export type TratativaPublic = {
  id: number;
  recordKind: TratativaRecordKind;
  recordKey: string;
  userId: number;
  userName: string;
  userCorporateId: string;
  note: string | null;
  startedAt: string;
  history?: TratativaHistoryEntry[];
  workflowStatus?: TratativaWorkflowStatus;
};
