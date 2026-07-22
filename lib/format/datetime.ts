/** Fuso horário padrão da aplicação (evita divergência SSR vs browser). */
export const APP_TIME_ZONE = "America/Sao_Paulo";

const MYSQL_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;
const SIR_DATETIME_DASH_RE = /^(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2})(?::(\d{2}))?$/;
const SIR_DATETIME_SPACE_RE = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Converte match SIR DD/MM/YYYY (com ou sem hífen antes da hora) em Date. */
function dateFromSirMatch(match: RegExpMatchArray): Date | null {
  const [, day, month, year, hour, minute, second = "00"] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Converte valor vindo do banco/API em Date. Strings MySQL usam horário de Brasília. */
export function parseAppDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (MYSQL_DATETIME_RE.test(trimmed)) {
    const normalized = trimmed.replace(" ", "T");
    const date = new Date(`${normalized}-03:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dashMatch = trimmed.match(SIR_DATETIME_DASH_RE);
  if (dashMatch) return dateFromSirMatch(dashMatch);

  const spaceMatch = trimmed.match(SIR_DATETIME_SPACE_RE);
  if (spaceMatch) return dateFromSirMatch(spaceMatch);

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Normaliza Date/string para ISO UTC (serialização consistente). */
export function normalizeDateTimeIso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = parseAppDateTime(String(value));
  return parsed ? parsed.toISOString() : null;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: APP_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: APP_TIME_ZONE,
});

/** Formata ISO/datetime para exibição em pt-BR. */
export function formatDateTimePtBr(value: string | null | undefined): string {
  const date = parseAppDateTime(value);
  if (!date) return "—";
  return dateTimeFormatter.format(date);
}

/** Partes de data/hora para exibição em duas linhas (sem scroll horizontal). */
export function formatDateTimeParts(
  value: string | null | undefined,
): { date: string; time: string } | null {
  const date = parseAppDateTime(value);
  if (!date) return null;
  return {
    date: dateFormatter.format(date),
    time: timeFormatter.format(date),
  };
}
