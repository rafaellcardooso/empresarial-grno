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

/** Agrupamentos DDD gravados pelos workers e omitidos das telas, filtros e relatórios do portal. */
export const HIDDEN_DDDS: readonly string[] = ["68", "69"];

/** Indica se o agrupamento DDD está oculto na exibição do portal. */
export function isDddHidden(ddd: string | null | undefined): boolean {
  const normalized = ddd?.trim();
  return Boolean(normalized && HIDDEN_DDDS.includes(normalized));
}

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

/** Lista agrupamentos DDD exibidos no portal em ordem numérica. */
export function listOperationalDdds(): string[] {
  return Object.keys(OPERATIONAL_DDD_UF)
    .filter((ddd) => !isDddHidden(ddd))
    .sort((a, b) => Number(a) - Number(b));
}

/** Lista UFs dos DDDs exibidos (valores únicos; `AM/RR` vira AM e RR). */
export function listOperationalUfs(): string[] {
  const ufs = new Set<string>();
  for (const ddd of listOperationalDdds()) {
    for (const part of OPERATIONAL_DDD_UF[ddd].split("/")) {
      const uf = part.trim().toUpperCase();
      if (uf) ufs.add(uf);
    }
  }
  return [...ufs].sort();
}

/** Valida agrupamento DDD recebido por URL; DDD oculto retorna undefined. */
export function operationalDddFromParam(raw: string | null | undefined): string | undefined {
  const normalized = raw?.trim();
  if (!normalized || isDddHidden(normalized)) return undefined;
  return normalized in OPERATIONAL_DDD_UF ? normalized : undefined;
}
