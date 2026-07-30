import type {
  TratativaChamadoStatus,
  TratativaChamadoStatusFilter,
} from "@/lib/config/tratativa-chamados";
import type { TratativaRecordKind } from "@/lib/models/tratativa";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import type { ValidacaoOutcome } from "@/lib/config/tratativa-workflow";

/** Escopo de relatório de tratativas (tipo de registro ou todos). */
export type TratativaReportScope = TratativaRecordKind | "ALL";

/** Filtros temporais e por tipo de registro. */
export type TratativaReportFilters = {
  from: Date;
  to: Date;
  recordKind: TratativaReportScope;
  status?: TratativaChamadoStatusFilter;
  page?: number;
};

/** Contagens agregadas da coorte (chamados iniciados no período). */
export type TratativaReportSummary = {
  /** Chamados iniciados no período (denominador do funil). */
  assuncoes: number;
  /** Chamados da coorte que registraram VT até o fim do período. */
  acionamentos: number;
  /** Chamados da coorte com solicitação de validação até o fim do período. */
  validacoesSolicitadas: number;
  /** Chamados da coorte com parecer de validação até o fim do período. */
  validacoes: number;
  validacoesAprovadas: number;
  validacoesReprovadas: number;
  /** Chamados da coorte concluídos até o fim do período. */
  concluidas: number;
  /** Chamados da coorte liberados até o fim do período. */
  liberacoes: number;
  /** Duração média (min) dos concluídos da coorte. */
  duracaoMediaMinutos: number | null;
};

/** Série diária de eventos operacionais ocorridos no período. */
export type TratativaReportDailyPoint = {
  date: string;
  total: number;
};

/** Fatia por etapa da coorte para gráfico de distribuição. */
export type TratativaReportEventSlice = {
  key: string;
  label: string;
  total: number;
};

/** Ranking de operador por acionamentos e conclusões no período. */
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

/** Linha de chamado BSOD para listagem por status. */
export type TratativaChamadoRow = {
  id: number;
  recordKey: string;
  userName: string;
  userCorporateId: string;
  status: TratativaChamadoStatus;
  startedAt: string;
  acionadoAt: string | null;
  validatedAt: string | null;
  concludedAt: string | null;
  releasedAt: string | null;
  outcome: ValidacaoOutcome | null;
  fca: ValidacaoFcaInput | null;
};
