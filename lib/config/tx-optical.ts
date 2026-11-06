import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";

/** UFs da região GRNO usadas no filtro TX (mesmas do cadastro). */
export const TX_REGION_UFS: readonly UserRegionUf[] = USER_REGION_OPTIONS.map((item) => item.uf);

const UF_IN_DESIGNACAO_RE = /\(([A-Z]{2})\)/g;
const DESIGNACAO_KM_RE = /^([\d]+(?:[.,]\d+)?)\s*KM$/i;
const DESIGNACAO_UF_SEG_RE = /^(\([A-Z]{2}\))+$/;
const DESIGNACAO_NOTE_RE = /^(RABICHO|BOOSTER|OTDR|RAMAN|\d)/i;

/** Partes estruturadas da designação GRB (`ROTA / XX KM / (UF) / EMPRESA / …`). */
export type TxDesignacaoParts = {
  rota: string;
  extensaoKm: number | null;
  empresa: string | null;
};

/** Extrai UFs entre parênteses na designação do CSV GRB (ex.: "(PA)", "(CE)(RN)"). */
export function extractUfsFromDesignacao(designacao: string): string[] {
  const found = new Set<string>();
  for (const match of designacao.matchAll(UF_IN_DESIGNACAO_RE)) {
    found.add(match[1]);
  }
  return [...found].sort();
}

/** Indica se alguma UF da designação está no escopo regional informado. */
export function designacaoMatchesRegion(
  designacao: string,
  regionUfs: ReadonlyArray<string> = TX_REGION_UFS,
): boolean {
  const allowed = new Set(regionUfs.map((uf) => uf.trim().toUpperCase()).filter(Boolean));
  if (allowed.size === 0) return false;
  return extractUfsFromDesignacao(designacao).some((uf) => allowed.has(uf));
}

/** Serializa UFs extraídas para coluna `ufs` (CSV ordenado). */
export function serializeTxUfs(ufs: Iterable<string>): string {
  return [...new Set([...ufs].map((uf) => uf.trim().toUpperCase()).filter(Boolean))]
    .sort()
    .join(",");
}

/** Normaliza um segmento pós-UF em nome de empresa, ou null se for observação. */
function parseEmpresaSegment(segment: string): string | null {
  const cleaned = segment.trim();
  if (!cleaned) return null;

  const parenCompany = cleaned.match(/^\(([A-Za-z][^/)]*)/);
  if (parenCompany) return parenCompany[1].trim() || null;

  const beforeParen = cleaned.split(" (")[0].trim();
  if (!beforeParen || DESIGNACAO_NOTE_RE.test(beforeParen)) return null;
  return beforeParen;
}

/**
 * Interpreta a designação GRB: rota, extensão em KM e empresa após os `(UF)`.
 * Ex.: `AGN … / 116 KM / (TO)(MA) / WIRELINK / RABICHO…` → WIRELINK, 116.
 */
export function parseTxDesignacao(designacao: string): TxDesignacaoParts {
  const raw = designacao.trim();
  if (!raw) return { rota: "", extensaoKm: null, empresa: null };

  const parts = raw
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  let extensaoKm: number | null = null;
  let lastUfIndex = -1;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const kmMatch = part.match(DESIGNACAO_KM_RE);
    if (kmMatch) {
      const value = Number(kmMatch[1].replace(",", "."));
      extensaoKm = Number.isFinite(value) ? value : null;
    }
    if (DESIGNACAO_UF_SEG_RE.test(part.replace(/\s+/g, ""))) {
      lastUfIndex = index;
    }
  }

  const companies: string[] = [];
  if (lastUfIndex >= 0) {
    for (const segment of parts.slice(lastUfIndex + 1)) {
      const company = parseEmpresaSegment(segment);
      if (!company) break;
      companies.push(company);
    }
  }

  return {
    rota: parts[0] ?? raw,
    extensaoKm,
    empresa: companies.length > 0 ? companies.join(" · ") : null,
  };
}
