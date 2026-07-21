/** Serializa linhas MySQL para JSON (Date vira ISO string). */
export function serializeRows<T>(rows: T[]): T[] {
  return JSON.parse(
    JSON.stringify(rows, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
  ) as T[];
}

/** Serializa uma linha MySQL ou retorna null. */
export function serializeRow<T>(row: T | null): T | null {
  if (row == null) return null;
  return serializeRows([row])[0];
}
