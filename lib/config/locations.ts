/** Catálogo compartilhado de agrupamentos operacionais DDD → UF. */
export const OPERATIONAL_DDD_UF: Record<string, string> = {
  "68": "AC",
  "69": "RO",
  "91": "PA",
  "92": "AM/RR",
  "95": "RR",
  "96": "AP",
  "97": "AM",
  "98": "MA",
  "99": "MA",
};

/** Retorna UF configurada para o agrupamento DDD. */
export function getOperationalDddUf(ddd: string | null | undefined): string | undefined {
  const normalized = ddd?.trim();
  return normalized ? OPERATIONAL_DDD_UF[normalized] : undefined;
}

/** Formata agrupamento operacional como `98 - MA`. */
export function operationalDddLabel(ddd: string): string {
  const normalized = ddd.trim();
  const uf = getOperationalDddUf(normalized);
  return uf ? `${normalized} - ${uf}` : normalized;
}

/** Lista agrupamentos DDD conhecidos em ordem numérica. */
export function listOperationalDdds(): string[] {
  return Object.keys(OPERATIONAL_DDD_UF).sort((a, b) => Number(a) - Number(b));
}

/** Valida agrupamento DDD recebido por URL. */
export function operationalDddFromParam(raw: string | null | undefined): string | undefined {
  const normalized = raw?.trim();
  return normalized && normalized in OPERATIONAL_DDD_UF ? normalized : undefined;
}
