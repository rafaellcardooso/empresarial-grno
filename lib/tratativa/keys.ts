import type { TratativaRecordKind } from "@/lib/models/tratativa";

/** Normaliza chave de registro para lookup consistente no banco. */
export function normalizeTratativaKey(kind: TratativaRecordKind, raw: string): string {
  const trimmed = raw.trim();
  if (kind === "BSOD") return trimmed.toUpperCase();
  return trimmed;
}

/** Valida kind recebido da API. */
export function parseTratativaRecordKind(
  value: string | null | undefined,
): TratativaRecordKind | null {
  if (value === "RAL" || value === "REC" || value === "BSOD") return value;
  return null;
}
