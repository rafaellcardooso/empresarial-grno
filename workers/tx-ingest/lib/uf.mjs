/** UFs padrão da região GRNO Empresarial. */
export const DEFAULT_TX_REGION_UFS = ["MA", "AM", "PA", "AP"];

const UF_IN_DESIGNACAO_RE = /\(([A-Z]{2})\)/g;

/** Extrai UFs entre parênteses na designação do CSV GRB. */
export function extractUfsFromDesignacao(designacao) {
  const found = new Set();
  for (const match of String(designacao ?? "").matchAll(UF_IN_DESIGNACAO_RE)) {
    found.add(match[1]);
  }
  return [...found].sort();
}

/** Serializa UFs para a coluna `ufs`. */
export function serializeTxUfs(ufs) {
  return [...new Set([...ufs].map((uf) => String(uf).trim().toUpperCase()).filter(Boolean))]
    .sort()
    .join(",");
}

/** Lê TX_REGION_UFS do ambiente (CSV); fallback para a região GRNO. */
export function parseRegionUfsFromEnv(raw) {
  if (!raw || !String(raw).trim()) return [...DEFAULT_TX_REGION_UFS];
  const list = String(raw)
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
  return list.length > 0 ? list : [...DEFAULT_TX_REGION_UFS];
}

/** Mantém o span se alguma UF extraída estiver no escopo. */
export function matchesRegion(designacao, regionUfs) {
  const allowed = new Set(regionUfs);
  return extractUfsFromDesignacao(designacao).some((uf) => allowed.has(uf));
}
