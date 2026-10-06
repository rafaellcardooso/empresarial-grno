const SIR_DATE_TIME = /(\d{2})\/(\d{2})\/(\d{4})\D+(\d{2}):(\d{2})/;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** Converte data para o valor de `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`, hora local). */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Lê valor de `datetime-local` como data local; inválido retorna null. */
export function parseDateTimeLocal(value: string): Date | null {
  const match = value.match(LOCAL_DATE_TIME);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/** Lê data do SIR (`dd/mm/aaaa hh:mm` ou `dd/mm/aaaa - hh:mm`); inválida retorna null. */
export function parseSirDateTime(value: string): Date | null {
  const match = value.match(SIR_DATE_TIME);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/** Formata valor de `datetime-local` como `dd/mm/aaaa hh:mm` (mesmo padrão da abertura no SIR). */
export function formatFcaDateTime(value: string): string {
  const match = value.match(LOCAL_DATE_TIME);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}
