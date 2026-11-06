import { TX_DIF_REF_TONES, type TxDifRefTone } from "@/lib/format/tx-optical";
import { isUserRegionUf, type UserRegionUf } from "@/lib/config/user-regions";

export type TxHrefFilters = {
  uf?: UserRegionUf;
  q?: string;
  dif?: TxDifRefTone;
  page?: number;
};

const TX_DIF_PARAM_SET = new Set<string>(TX_DIF_REF_TONES);

/** Parseia UF da query string; só aceita MA/AM/PA/AP. */
export function parseTxUfParam(raw: string | null | undefined): UserRegionUf | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().toUpperCase();
  return isUserRegionUf(normalized) ? normalized : undefined;
}

/** Normaliza termo de busca TX; vazio retorna undefined. */
export function parseTxSearchParam(raw: string | null | undefined): string | undefined {
  const value = raw?.trim();
  return value || undefined;
}

/** Parseia faixa de DIF da query string. */
export function parseTxDifParam(raw: string | null | undefined): TxDifRefTone | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().toLowerCase();
  return TX_DIF_PARAM_SET.has(normalized) ? (normalized as TxDifRefTone) : undefined;
}

/** Monta URL `/tx` preservando UF, busca, faixa de DIF e página. */
export function buildTxFilterHref(filters: TxHrefFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.uf) params.set("uf", filters.uf);
  if (filters.q) params.set("q", filters.q);
  if (filters.dif) params.set("dif", filters.dif);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `/tx?${qs}` : "/tx";
}

/** Monta URL de exportação TX preservando filtros, sem paginação. */
export function buildTxExportHref(filters: Omit<TxHrefFilters, "page"> = {}): string {
  return buildTxFilterHref({ ...filters, page: undefined }).replace(/^\/tx/, "/api/export/tx");
}
