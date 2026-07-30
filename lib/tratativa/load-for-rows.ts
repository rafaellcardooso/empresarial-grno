import type { TratativaPublic } from "@/lib/models/tratativa";
import { mapActiveTratativas } from "@/lib/queries/tratativas";
import { enrichTratativasWorkflow } from "@/lib/queries/tratativa-workflow";

/** Carrega mapa de tratativas ativas para inventário BSOD (MAC). */
export async function loadTratativasForBsodRows(
  rows: { mac: string | null }[],
): Promise<Record<string, TratativaPublic>> {
  const keys = rows.map((row) => String(row.mac ?? "")).filter(Boolean);
  const map = await mapActiveTratativas("BSOD", keys);
  return enrichTratativasWorkflow(map);
}

/** Carrega mapa de tratativas ativas para registros RAL ou REC. */
export async function loadTratativasForSirRows(
  recordKind: "RAL" | "REC",
  rows: { num_recup: string }[],
): Promise<Record<string, TratativaPublic>> {
  return mapActiveTratativas(recordKind, rows.map((row) => row.num_recup).filter(Boolean));
}
