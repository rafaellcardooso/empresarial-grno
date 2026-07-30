import type { SdhVendorFilter } from "@/lib/config/sdh-filters";

/** Filtros do relatório analítico SDH. */
export type SdhReportFilters = {
  from: Date;
  to: Date;
  vendor?: SdhVendorFilter;
  ddd?: string;
};

/** Resumo do backlog ativo e da atividade de tratativa no período. */
export type SdhReportSummary = {
  totalActive: number;
  pending: number;
  inProgress: number;
  neverTouched: number;
  updatesInPeriod: number;
  closesInPeriod: number;
  alarmsTouchedInPeriod: number;
};

/** Fatia de distribuição do backlog. */
export type SdhReportSlice = {
  key: string;
  label: string;
  total: number;
};

/** Faixa de idade dos alarmes ativos. */
export type SdhReportAgeBucket = {
  key: string;
  label: string;
  total: number;
};

/** Ranking genérico do relatório SDH. */
export type SdhReportRankRow = {
  key: string;
  label: string;
  total: number;
  hint?: string;
};

/** Ponto diário de eventos de tratativa. */
export type SdhReportDailyPoint = {
  date: string;
  updates: number;
  closes: number;
  total: number;
};

/** Ranking de login por eventos no período. */
export type SdhReportOperatorRow = {
  userLogin: string;
  updates: number;
  closes: number;
  total: number;
};

/** Payload completo do painel analítico SDH. */
export type SdhReportData = {
  summary: SdhReportSummary;
  statusSlices: SdhReportSlice[];
  ageBuckets: SdhReportAgeBucket[];
  byDdd: SdhReportRankRow[];
  byVendor: SdhReportRankRow[];
  byMunicipio: SdhReportRankRow[];
  byAlarme: SdhReportRankRow[];
  daily: SdhReportDailyPoint[];
  operators: SdhReportOperatorRow[];
};
