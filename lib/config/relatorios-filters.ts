import type { TratativaReportFilters } from "@/lib/models/tratativa-report";
import { tratativaReportScopeFromParam } from "@/lib/config/relatorios-tratativa";

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

/** Formata Date para parâmetro de URL (YYYY-MM-DD). */
export function formatRelatorioDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Início do dia seguinte (limite exclusivo SQL). */
export function endExclusiveFromInclusiveDate(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monta filtros de relatório de tratativas a partir da query string. */
export function parseTratativaReportParams(params: {
  de?: string;
  ate?: string;
  kind?: string;
}): TratativaReportFilters {
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
    recordKind: tratativaReportScopeFromParam(params.kind),
  };
}

/** Monta query string para filtros de relatório de tratativas. */
export function buildTratativaReportHref(filters: TratativaReportFilters): string {
  const params = new URLSearchParams();
  params.set("de", formatRelatorioDateParam(filters.from));
  params.set("ate", formatRelatorioDateParam(filters.to));
  if (filters.recordKind !== "BSOD") {
    params.set("kind", filters.recordKind);
  }
  const query = params.toString();
  return query ? `/relatorios/tratativas?${query}` : "/relatorios/tratativas";
}

/** Rótulo compacto do período selecionado (pt-BR). */
export function relatorioPeriodLabel(from: Date, to: Date): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${formatter.format(from)} a ${formatter.format(to)}`;
}
