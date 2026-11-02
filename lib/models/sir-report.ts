import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";

/** Domínio do relatório SIR. */
export type SirReportDomain = "all" | "ral" | "rec";

/** Evento da cronologia de um chamado SIR concluído. */
export type SirConcludedHistoryEntry = {
  eventType: string;
  note: string | null;
  userName: string;
  createdAt: string;
};

/** Linha da listagem de chamados SIR concluídos no período. */
export type SirConcludedChamadoRow = {
  id: number;
  recordKind: "RAL" | "REC";
  recordKey: string;
  cf: string | null;
  classification: string | null;
  summary: string | null;
  details: string | null;
  abertura: string | null;
  userName: string;
  userCorporateId: string;
  startedAt: string;
  concludedAt: string;
  fca: ValidacaoFcaInput | null;
  history: SirConcludedHistoryEntry[];
};

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
  /** Conclusões (`CONCLUIDA`) no período do filtro. */
  conclusionsInPeriod: number;
};

/** Escopos de KPI do relatório (RAL e fatias REC/DSR/TCQ). */
export type SirReportKpiScopeKey = "RAL" | "REC" | "DSR" | "TCQ";

/** Linha de KPIs por escopo. */
export type SirReportKpiScope = SirReportDomainSummary & {
  key: SirReportKpiScopeKey;
  label: string;
};

/** Resumo consolidado sem somar RAL+REC. */
export type SirReportSummary = {
  ral: SirReportDomainSummary;
  rec: SirReportDomainSummary;
  /** KPIs separados por RAL / REC / DSR / TCQ. */
  scopes: SirReportKpiScope[];
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

/** Série diária (aberturas ou conclusões) no período. */
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
  dailyConclusions: SirReportDailyPoint[];
};
