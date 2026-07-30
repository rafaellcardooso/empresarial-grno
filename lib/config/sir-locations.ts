import { getOperationalDddUf, operationalDddLabel } from "@/lib/config/locations";

export type SirLocation = {
  code: string;
  city: string;
  ddd: string;
  uf: string;
};

type SirLocationSource = Omit<SirLocation, "uf">;

/**
 * Mapeia o código geográfico do CF ao agrupamento DDD usado pelo SDH.
 * Entradas seguem a classificação operacional, não o DDD telefônico municipal exato.
 */
const SIR_LOCATION_SOURCES: SirLocationSource[] = [
  { code: "ATM", city: "ALTAMIRA", ddd: "91" },
  { code: "BLA", city: "BALSAS", ddd: "98" },
  { code: "BLM", city: "BELÉM", ddd: "91" },
  { code: "BVA", city: "BOA VISTA", ddd: "92" },
  { code: "CXUA", city: "CAXIAS", ddd: "98" },
  { code: "ITZ", city: "IMPERATRIZ", ddd: "98" },
  { code: "MBA", city: "MARABÁ", ddd: "91" },
  { code: "MNS", city: "MANAUS", ddd: "92" },
  { code: "MOSQ", city: "MOSQUEIRO", ddd: "91" },
  { code: "MPA", city: "MACAPÁ", ddd: "96" },
  { code: "SLS", city: "SÃO LUÍS", ddd: "98" },
  { code: "SRM", city: "SANTARÉM", ddd: "91" },
];

/** Localizações SIR enriquecidas com UF do catálogo compartilhado. */
export const SIR_LOCATIONS: SirLocation[] = SIR_LOCATION_SOURCES.map((location) => ({
  ...location,
  uf: getOperationalDddUf(location.ddd) ?? "",
}));

const LOCATION_BY_CODE = new Map(SIR_LOCATIONS.map((location) => [location.code, location]));

/** Extrai código geográfico do segundo segmento de um CF executante. */
export function sirLocationCodeFromCf(cf: string | null | undefined): string | undefined {
  if (!cf) return undefined;
  const code = cf.split("/")[1]?.trim().toUpperCase();
  return code || undefined;
}

/** Retorna localização operacional configurada para o CF executante. */
export function getSirLocationByCf(cf: string | null | undefined): SirLocation | null {
  const code = sirLocationCodeFromCf(cf);
  return code ? (LOCATION_BY_CODE.get(code) ?? null) : null;
}

/** Retorna agrupamento DDD configurado para o CF executante. */
export function sirDddFromCf(cf: string | null | undefined): string | null {
  return getSirLocationByCf(cf)?.ddd ?? null;
}

/** Lista códigos geográficos de CF vinculados ao agrupamento DDD. */
export function sirLocationCodesForDdd(ddd: string | null | undefined): string[] {
  const normalized = ddd?.trim();
  if (!normalized) return [];
  return SIR_LOCATIONS.filter((location) => location.ddd === normalized).map(
    (location) => location.code,
  );
}

/** Formata o agrupamento DDD de um CF como `91 - PA`. */
export function sirDddLabelFromCf(cf: string | null | undefined): string {
  const ddd = sirDddFromCf(cf);
  return ddd ? operationalDddLabel(ddd) : "—";
}

/** Acrescenta DDD operacional a um registro SIR sem alterar o objeto original. */
export function enrichSirRecordLocation<T extends { cf_executante?: string | null }>(
  record: T,
): T & { ddd: string | null } {
  return {
    ...record,
    ddd: sirDddFromCf(record.cf_executante),
  };
}
