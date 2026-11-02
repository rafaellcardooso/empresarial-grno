import type { SirTreatmentFilter } from "@/lib/config/sir-filters";

/** Dimensão do drill-down de ativos no relatório SIR. */
export type SirReportAtivosDim = "ddd" | "tipo" | "cf";

/** Domínio do drill-down. */
export type SirReportAtivosDomain = "RAL" | "REC" | "all";

/** Filtros da listagem de ativos do drill-down. */
export type SirReportAtivosFilters = {
  dim: SirReportAtivosDim;
  key: string;
  domain: SirReportAtivosDomain;
  tratativa?: SirTreatmentFilter;
  reportDdd?: string;
  page: number;
  pageSize: number;
};

/** Linha unificada RAL/REC para a tabela de drill-down. */
export type SirReportAtivoRow = {
  kind: "RAL" | "REC";
  numRecup: string;
  cf: string | null;
  abertura: string | null;
  classification: string | null;
  summary: string | null;
  details: string | null;
  treatment: "pendente" | "em-tratativa";
};
