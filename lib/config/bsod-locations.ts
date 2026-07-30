import { getOperationalDddUf, operationalDddLabel } from "@/lib/config/locations";

/** Localização operacional BSOD derivada de `ope` até o inventário expor DDD/município. */
export type BsodLocation = {
  ope: string;
  city: string;
  ddd: string;
  uf: string;
};

type BsodLocationSource = Omit<BsodLocation, "uf">;

/** Mapa extensível: novas cidades entram adicionando operações. */
const BSOD_LOCATION_SOURCES: BsodLocationSource[] = [{ ope: "sls", city: "SÃO LUÍS", ddd: "98" }];

/** Localizações BSOD enriquecidas com UF do catálogo compartilhado. */
export const BSOD_LOCATIONS: BsodLocation[] = BSOD_LOCATION_SOURCES.map((location) => ({
  ...location,
  uf: getOperationalDddUf(location.ddd) ?? "",
}));

/** Índice OPE → localização (case-insensitive). */
const LOCATION_BY_OPE = new Map(
  BSOD_LOCATIONS.map((item) => [item.ope.trim().toLowerCase(), item]),
);

/** Índice DDD → operações mapeadas. */
const OPES_BY_DDD = new Map<string, string[]>();
for (const item of BSOD_LOCATIONS) {
  const list = OPES_BY_DDD.get(item.ddd) ?? [];
  list.push(item.ope);
  OPES_BY_DDD.set(item.ddd, list);
}

/** Retorna localização configurada para a operação PME. */
export function getBsodLocationByOpe(ope: string | null | undefined): BsodLocation | null {
  if (!ope) return null;
  return LOCATION_BY_OPE.get(ope.trim().toLowerCase()) ?? null;
}

/** Rótulo de operação em maiúsculas (cidade ou OPE bruto). */
export function bsodOperationLabel(ope: string | null | undefined): string {
  const location = getBsodLocationByOpe(ope);
  if (location) return location.city;
  const raw = (ope ?? "").trim();
  return raw ? raw.toUpperCase() : "—";
}

/** Formata KPI/filtro DDD como `98 - MA`. */
export function bsodDddLabel(ddd: string): string {
  return operationalDddLabel(ddd);
}

/** Lista DDDs conhecidos para chips/KPIs. */
export function listBsodDddOptions(): Array<{ ddd: string; label: string; opes: string[] }> {
  const byDdd = new Map<string, { ddd: string; label: string; opes: string[] }>();
  for (const item of BSOD_LOCATIONS) {
    const current = byDdd.get(item.ddd);
    if (current) {
      current.opes.push(item.ope);
      continue;
    }
    byDdd.set(item.ddd, {
      ddd: item.ddd,
      label: bsodDddLabel(item.ddd),
      opes: [item.ope],
    });
  }
  return [...byDdd.values()].sort((a, b) => Number(a.ddd) - Number(b.ddd));
}

/** Resolve operações PME para um DDD configurado. */
export function bsodOpesForDdd(ddd: string | null | undefined): string[] {
  if (!ddd) return [];
  return OPES_BY_DDD.get(ddd.trim()) ?? [];
}

/** Parseia DDD da URL; inválido retorna undefined. */
export function parseBsodDddParam(raw: string | null | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  return OPES_BY_DDD.has(value) ? value : undefined;
}
