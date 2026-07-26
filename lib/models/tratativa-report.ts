import type { TratativaRecordKind } from "@/lib/models/tratativa";

/** Escopo de relatório de tratativas (tipo de registro ou todos). */
export type TratativaReportScope = TratativaRecordKind | "ALL";

/** Filtros temporais e por tipo de registro. */
export type TratativaReportFilters = {
  from: Date;
  to: Date;
  recordKind: TratativaReportScope;
};

/** Contagens agregadas de eventos de tratativa no período. */
export type TratativaReportSummary = {
  assuncoes: number;
  acionamentos: number;
  validacoesSolicitadas: number;
  validacoes: number;
  validacoesAprovadas: number;
  validacoesReprovadas: number;
  concluidas: number;
  liberacoes: number;
  duracaoMediaMinutos: number | null;
};

/** Série diária de eventos operacionais. */
export type TratativaReportDailyPoint = {
  date: string;
  total: number;
};

/** Fatia por tipo de evento para gráfico de distribuição. */
export type TratativaReportEventSlice = {
  key: string;
  label: string;
  total: number;
};

/** Ranking de operador por acionamentos e conclusões. */
export type TratativaReportOperatorRow = {
  userName: string;
  userCorporateId: string;
  acionamentos: number;
  concluidas: number;
};

/** Ranking genérico para gráficos de relatório de tratativas. */
export type TratativaReportRankRow = {
  key: string;
  label: string;
  total: number;
  hint?: string;
};

/** Payload completo do painel analítico de tratativas. */
export type TratativaReportData = {
  summary: TratativaReportSummary;
  daily: TratativaReportDailyPoint[];
  byEvent: TratativaReportEventSlice[];
  operators: TratativaReportOperatorRow[];
  bySymptom: TratativaReportRankRow[];
  topClients: TratativaReportRankRow[];
};
