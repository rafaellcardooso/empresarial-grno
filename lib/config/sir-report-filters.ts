import {
  endExclusiveFromInclusiveDate,
  formatRelatorioDateParam,
} from "@/lib/config/relatorios-filters";
import { operationalDddFromParam } from "@/lib/config/locations";
import { sirTreatmentFromParam, type SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirReportDomain, SirReportFilters } from "@/lib/models/sir-report";

const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

/** Normaliza data ISO (YYYY-MM-DD) ou retorna undefined. */
function parseIsoDate(value?: string | null): Date | undefined {
  if (!value?.trim()) return undefined;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

/** Normaliza domínio RAL/REC da query string. */
export function sirReportDomainFromParam(param?: string | null): SirReportDomain {
  if (param === "ral" || param === "rec") return param;
  return "all";
}

/** Monta filtros do relatório SIR a partir da query string. */
export function parseSirReportParams(params: {
  de?: string;
  ate?: string;
  dominio?: string;
  tratativa?: string;
  ddd?: string;
}): SirReportFilters {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultTo = today;
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - (DEFAULT_RANGE_DAYS - 1));

  let from = parseIsoDate(params.de) ?? defaultFrom;
  let to = parseIsoDate(params.ate) ?? defaultTo;

  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  const maxSpanMs = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxSpanMs) {
    from = new Date(to);
    from.setDate(from.getDate() - (MAX_RANGE_DAYS - 1));
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  return {
    from,
    to,
    domain: sirReportDomainFromParam(params.dominio),
    tratativa: sirTreatmentFromParam(params.tratativa),
    ddd: operationalDddFromParam(params.ddd),
  };
}

/** Monta href do relatório SIR preservando filtros. */
export function buildSirReportHref(filters: SirReportFilters): string {
  const params = new URLSearchParams();
  params.set("de", formatRelatorioDateParam(filters.from));
  params.set("ate", formatRelatorioDateParam(filters.to));
  if (filters.domain !== "all") params.set("dominio", filters.domain);
  if (filters.tratativa) params.set("tratativa", filters.tratativa);
  if (filters.ddd) params.set("ddd", filters.ddd);
  return `/relatorios/sir?${params.toString()}`;
}

/** Href do monitoramento SIR (RAL ou REC) com filtros operacionais. */
export function buildSirMonitorHref(filters: SirReportFilters): string {
  const params = new URLSearchParams();
  if (filters.tratativa) params.set("tratativa", filters.tratativa);
  if (filters.ddd) params.set("ddd", filters.ddd);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  if (filters.domain === "rec") return `/sir/recs${suffix}`;
  if (filters.domain === "ral") return `/sir/rals${suffix}`;
  return `/sir${suffix}`;
}

/** Href de exportação CSV do relatório SIR. */
export function buildSirReportExportHref(filters: SirReportFilters): string {
  const params = new URLSearchParams();
  params.set("de", formatRelatorioDateParam(filters.from));
  params.set("ate", formatRelatorioDateParam(filters.to));
  if (filters.domain !== "all") params.set("dominio", filters.domain);
  if (filters.tratativa) params.set("tratativa", filters.tratativa);
  if (filters.ddd) params.set("ddd", filters.ddd);
  return `/api/export/relatorios/sir?${params.toString()}`;
}

/** Limite exclusivo SQL a partir da data final inclusiva. */
export function sirReportEndExclusive(filters: SirReportFilters): Date {
  return endExclusiveFromInclusiveDate(filters.to);
}

/** Opções de domínio no formulário. */
export const SIR_REPORT_DOMAIN_OPTIONS: Array<{ value: SirReportDomain; label: string }> = [
  { value: "all", label: "RAL e REC" },
  { value: "ral", label: "Somente RAL" },
  { value: "rec", label: "Somente REC" },
];

/** Opções de tratativa no formulário. */
export const SIR_REPORT_TREATMENT_OPTIONS: Array<{
  value: "" | SirTreatmentFilter;
  label: string;
}> = [
  { value: "", label: "Todas as tratativas" },
  { value: "pendente", label: "Pendentes" },
  { value: "em-tratativa", label: "Em tratativa" },
];
