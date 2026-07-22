export type RecTipoKey = "rec" | "dsq" | "tcq";

export type RecTipoDefinition = {
  key: RecTipoKey;
  prefix: string;
  label: string;
};

/** Tipos REC/DSQ/TCQ derivados do prefixo de num_recup. */
export const REC_TIPOS: RecTipoDefinition[] = [
  { key: "rec", prefix: "REC", label: "REC" },
  { key: "dsq", prefix: "DSQ", label: "DSQ" },
  { key: "tcq", prefix: "TCQ", label: "TCQ" },
];

const REC_TIPO_BY_KEY = new Map(REC_TIPOS.map((tipo) => [tipo.key, tipo]));

/** Valida chave de filtro `tipo` na URL de REC. */
export function isRecTipoKey(value?: string): value is RecTipoKey {
  return value != null && REC_TIPO_BY_KEY.has(value as RecTipoKey);
}

/** Converte query string `tipo` no prefixo de num_recup (REC/DSQ/TCQ). */
export function recTipoPrefixFromParam(param?: string): string | undefined {
  if (!param || !isRecTipoKey(param)) return undefined;
  return REC_TIPO_BY_KEY.get(param)?.prefix;
}

/** Rótulo legível do filtro REC ativo. */
export function recTipoFilterLabel(param?: string): string | undefined {
  if (!param || !isRecTipoKey(param)) return undefined;
  return REC_TIPO_BY_KEY.get(param)?.label;
}

/** Classifica num_recup ativo em REC, DSQ ou TCQ. */
export function recTipoKeyFromNumRecup(numRecup: string): RecTipoKey | null {
  const prefix = numRecup.split("-")[0]?.toUpperCase();
  if (prefix === "REC") return "rec";
  if (prefix === "DSQ") return "dsq";
  if (prefix === "TCQ") return "tcq";
  return null;
}

/** Monta cláusula SQL LIKE para filtro de tipo REC. */
export function recTipoLikePrefix(prefix: string): string {
  return `${prefix}-%`;
}
