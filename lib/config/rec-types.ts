export type RecTipoKey = "rec" | "dsr" | "tcq";

export type RecTipoDefinition = {
  key: RecTipoKey;
  prefix: string;
  label: string;
  chipLabel: string;
  filterClass: string;
};

/** Tipos REC/DSR/TCQ derivados do prefixo de num_recup. */
export const REC_TIPOS: RecTipoDefinition[] = [
  {
    key: "rec",
    prefix: "REC",
    label: "REC",
    chipLabel: "REC",
    filterClass: "sir-filter-chip--rec-rec",
  },
  {
    key: "dsr",
    prefix: "DSR",
    label: "DSR",
    chipLabel: "DSR",
    filterClass: "sir-filter-chip--rec-dsr",
  },
  {
    key: "tcq",
    prefix: "TCQ",
    label: "TCQ",
    chipLabel: "TCQ",
    filterClass: "sir-filter-chip--rec-tcq",
  },
];

const REC_TIPO_BY_KEY = new Map(REC_TIPOS.map((tipo) => [tipo.key, tipo]));

/** Valida chave de filtro `tipo` na URL de REC. */
export function isRecTipoKey(value?: string): value is RecTipoKey {
  return value != null && REC_TIPO_BY_KEY.has(value as RecTipoKey);
}

/** Converte query string `tipo` no prefixo de num_recup (REC/DSR/TCQ). */
export function recTipoPrefixFromParam(param?: string): string | undefined {
  if (!param || !isRecTipoKey(param)) return undefined;
  return REC_TIPO_BY_KEY.get(param)?.prefix;
}

/** Rótulo legível do filtro REC ativo. */
export function recTipoFilterLabel(param?: string): string | undefined {
  if (!param || !isRecTipoKey(param)) return undefined;
  return REC_TIPO_BY_KEY.get(param)?.label;
}

/** Rótulo de página/escopo conforme filtro de tipo (ou todos). */
export function recScopePageLabel(tipo?: RecTipoKey): string {
  return recTipoFilterLabel(tipo) ?? "REC/DSR/TCQ";
}

/** Classifica num_recup ativo em REC, DSR ou TCQ. */
export function recTipoKeyFromNumRecup(numRecup: string): RecTipoKey | null {
  const prefix = numRecup.split("-")[0]?.toUpperCase();
  if (prefix === "REC") return "rec";
  if (prefix === "DSR") return "dsr";
  if (prefix === "TCQ") return "tcq";
  return null;
}

/** Rótulo de exibição do registro no grupo recs (REC, DSR ou TCQ). */
export function recGroupDisplayLabel(numRecup: string): string {
  const key = recTipoKeyFromNumRecup(numRecup);
  if (key === "dsr") return "DSR";
  if (key === "tcq") return "TCQ";
  if (key === "rec") return "REC";
  const prefix = numRecup.split("-")[0]?.trim().toUpperCase();
  return prefix || "REC";
}

/** Monta cláusula SQL LIKE para filtro de tipo REC. */
export function recTipoLikePrefix(prefix: string): string {
  return `${prefix}-%`;
}
