import type { SirTreatmentFilter } from "@/lib/config/sir-filters";

/** Domínio do relatório SIR. */
export type SirReportDomain = "all" | "ral" | "rec";

/** Filtros do relatório analítico SIR. */
export type SirReportFilters = {
  from: Date;
  to: Date;
  domain: SirReportDomain;
  tratativa?: SirTreatmentFilter;
  ddd?: string;
};

/** Contagens de um domínio (RAL ou REC). */
export type SirReportDomainSummary = {
  totalActive: number;
  pending: number;
  inTreatment: number;
  openingsInPeriod: number;
};

/** Resumo consolidado sem somar RAL+REC. */
export type SirReportSummary = {
  ral: SirReportDomainSummary;
  rec: SirReportDomainSummary;
};

/** Fatia genérica (status, idade, ranking). */
export type SirReportSlice = {
  key: string;
  label: string;
  total: number;
  domain?: "RAL" | "REC";
};

/** Faixa de idade dos registros ativos. */
export type SirReportAgeBucket = {
  key: string;
  label: string;
  total: number;
  domain: "RAL" | "REC";
};

/** Ranking genérico. */
export type SirReportRankRow = {
  key: string;
  label: string;
  total: number;
  domain: "RAL" | "REC";
};

/** Série diária de aberturas no período. */
export type SirReportDailyPoint = {
  date: string;
  ral: number;
  rec: number;
  total: number;
};

/** Payload completo do painel analítico SIR. */
export type SirReportData = {
  summary: SirReportSummary;
  ageBuckets: SirReportAgeBucket[];
  byCf: SirReportRankRow[];
  byTipo: SirReportRankRow[];
  byDdd: SirReportRankRow[];
  dailyOpenings: SirReportDailyPoint[];
};
