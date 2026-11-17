import { parseTxSearchParam, parseTxUfParam } from "@/lib/config/tx-filters";
import type { UserRegionUf } from "@/lib/config/user-regions";

export type TxHistoryHrefFilters = {
  designacao?: string;
  uf?: UserRegionUf;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
};

/**
 * Aceita datetime ISO ou `YYYY-MM-DD[ HH:MM:SS]`; rejeita valores inválidos.
 * Com `endOfDay`, data pura vira `23:59:59` (filtro `to`).
 */
export function parseTxHistoryDateParam(
  raw: string | null | undefined,
  options: { endOfDay?: boolean } = {},
): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/.test(value)) return undefined;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ms = Date.parse(normalized.length === 10 ? `${normalized}T00:00:00` : normalized);
  if (!Number.isFinite(ms)) return undefined;
  if (value.length === 10) {
    return options.endOfDay ? `${value} 23:59:59` : `${value} 00:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value.replace("T", " ")}:00`;
  if (value.includes("T")) return value.replace("T", " ").slice(0, 19);
  return value.slice(0, 19);
}

/** Normaliza designação exata da query (drawer). */
export function parseTxHistoryDesignacaoParam(raw: string | null | undefined): string | undefined {
  const value = raw?.trim();
  return value || undefined;
}

/** Extrai filtros de histórico a partir de URLSearchParams. */
export function parseTxHistorySearchParams(sp: URLSearchParams): {
  designacao?: string;
  uf?: UserRegionUf;
  q?: string;
  from?: string;
  to?: string;
} {
  return {
    designacao: parseTxHistoryDesignacaoParam(sp.get("designacao")),
    uf: parseTxUfParam(sp.get("uf")),
    q: parseTxSearchParam(sp.get("q")),
    from: parseTxHistoryDateParam(sp.get("from")),
    to: parseTxHistoryDateParam(sp.get("to"), { endOfDay: true }),
  };
}

/** Monta URL de exportação do histórico TX preservando filtros. */
export function buildTxHistoryExportHref(filters: Omit<TxHistoryHrefFilters, "page"> = {}): string {
  const params = new URLSearchParams();
  if (filters.designacao) params.set("designacao", filters.designacao);
  if (filters.uf) params.set("uf", filters.uf);
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return qs ? `/api/export/tx-history?${qs}` : "/api/export/tx-history";
}
