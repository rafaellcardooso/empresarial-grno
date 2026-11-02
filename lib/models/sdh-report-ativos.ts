import type { SdhStatusFilter, SdhVendorFilter } from "@/lib/config/sdh-filters";

/** Dimensão do drill-down de ativos no relatório SDH. */
export type SdhReportAtivosDim = "ddd" | "vendor" | "municipio" | "alarme";

/** Filtros da listagem de ativos do drill-down. */
export type SdhReportAtivosFilters = {
  dim: SdhReportAtivosDim;
  key: string;
  vendor?: SdhVendorFilter;
  ddd?: string;
  status?: SdhStatusFilter;
  page: number;
  pageSize: number;
};

/** Linha de alarme ativo para a tabela de drill-down. */
export type SdhReportAtivoRow = {
  id: number;
  ne: string | null;
  alarme: string | null;
  ddd: string | null;
  municipio: string | null;
  vendor: string | null;
  porta: string | null;
  circuito: string | null;
  dataAlarme: string | null;
  treatment: "pendente" | "em-tratativa";
  tratativaUserLogin: string | null;
};
