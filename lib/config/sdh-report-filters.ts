import {
  endExclusiveFromInclusiveDate,
  formatRelatorioDateParam,
} from "@/lib/config/relatorios-filters";
import {
  buildSdhExportHref,
  buildSdhFilterHref,
  parseSdhDddParam,
  parseSdhVendorParam,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import type { SdhReportFilters } from "@/lib/models/sdh-report";

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

/** Monta filtros do relatório SDH a partir da query string. */
export function parseSdhReportParams(params: {
  de?: string;
  ate?: string;
  vendor?: string;
  ddd?: string;
}): SdhReportFilters {
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
    vendor: parseSdhVendorParam(params.vendor),
    ddd: parseSdhDddParam(params.ddd),
  };
}

/** Monta href do relatório SDH preservando período e filtros. */
export function buildSdhReportHref(filters: SdhReportFilters): string {
  const params = new URLSearchParams();
  params.set("de", formatRelatorioDateParam(filters.from));
  params.set("ate", formatRelatorioDateParam(filters.to));
  if (filters.vendor) params.set("vendor", filters.vendor);
  if (filters.ddd) params.set("ddd", filters.ddd);
  return `/relatorios/sdh?${params.toString()}`;
}

/** Href da listagem operacional com os mesmos filtros de gerência/DDD. */
export function buildSdhMonitorHref(filters: Pick<SdhReportFilters, "vendor" | "ddd">): string {
  return buildSdhFilterHref({ vendor: filters.vendor, ddd: filters.ddd });
}

/** Href de exportação CSV dos alarmes ativos no mesmo escopo. */
export function buildSdhReportExportHref(
  filters: Pick<SdhReportFilters, "vendor" | "ddd">,
): string {
  return buildSdhExportHref({ vendor: filters.vendor, ddd: filters.ddd });
}

/** Limite exclusivo SQL a partir da data final inclusiva. */
export function sdhReportEndExclusive(filters: SdhReportFilters): Date {
  return endExclusiveFromInclusiveDate(filters.to);
}

/** Lista de vendors para o select do formulário. */
export const SDH_REPORT_VENDOR_OPTIONS: Array<{ value: "" | SdhVendorFilter; label: string }> = [
  { value: "", label: "Todas as gerências" },
  { value: "datacom", label: "Datacom" },
  { value: "tellabs", label: "Tellabs" },
  { value: "outros", label: "Outros" },
];
