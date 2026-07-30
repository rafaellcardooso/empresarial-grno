import { operationalDddLabel } from "@/lib/config/locations";

/** Vendor de filtro na página SDH. */
export type SdhVendorFilter = "datacom" | "tellabs" | "outros";
export type SdhStatusFilter = "pendente" | "em-tratativa";

export const SDH_VENDOR_FILTERS: SdhVendorFilter[] = ["datacom", "tellabs", "outros"];

export const SDH_VENDOR_LABELS: Record<SdhVendorFilter, string> = {
  datacom: "Datacom",
  tellabs: "Tellabs",
  outros: "Outros",
};

/** Valor de query para DDD vazio. */
export const SDH_DDD_EMPTY = "sem";

/** Classifica `gerencia` nos três grupos da UI. */
export function classifySdhVendor(gerencia: string | null | undefined): SdhVendorFilter {
  const value = (gerencia ?? "").trim().toLowerCase();
  if (value === "datacom") return "datacom";
  if (value.includes("tellabs")) return "tellabs";
  return "outros";
}

/** Parseia vendor da query string; inválido retorna undefined (todos). */
export function parseSdhVendorParam(raw: string | null | undefined): SdhVendorFilter | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === "datacom" || value === "tellabs" || value === "outros") return value;
  return undefined;
}

/** Normaliza filtro DDD da URL (`sem` = vazio). */
export function parseSdhDddParam(raw: string | null | undefined): string | undefined {
  if (raw == null || raw === "") return undefined;
  return raw.trim();
}

type SdhHrefFilters = {
  vendor?: SdhVendorFilter;
  ddd?: string;
  status?: SdhStatusFilter;
  q?: string;
  page?: number;
  normalizedPage?: number;
};

/** Monta href da página SDH com filtros de vendor e DDD. */
export function buildSdhFilterHref(filters: SdhHrefFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.vendor) params.set("vendor", filters.vendor);
  if (filters.ddd) params.set("ddd", filters.ddd);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.normalizedPage && filters.normalizedPage > 1) {
    params.set("normalizedPage", String(filters.normalizedPage));
  }
  const qs = params.toString();
  return qs ? `/sdh?${qs}` : "/sdh";
}

/** Monta URL de exportação SDH preservando filtros e busca, sem paginação. */
export function buildSdhExportHref(filters: SdhHrefFilters = {}): string {
  return buildSdhFilterHref({ ...filters, page: undefined }).replace(/^\/sdh/, "/api/export/sdh");
}

/** Normaliza termo de busca SDH; vazio retorna undefined. */
export function parseSdhSearchParam(raw: string | null | undefined): string | undefined {
  const value = raw?.trim();
  return value || undefined;
}

/** Parseia status operacional da query string. */
export function parseSdhStatusParam(raw: string | null | undefined): SdhStatusFilter | undefined {
  if (raw === "pendente" || raw === "em-tratativa") return raw;
  return undefined;
}

/** Fragmento SQL WHERE para vendor (placeholders `?`). */
export function sdhVendorSql(vendor: SdhVendorFilter | undefined): {
  clause: string;
  params: string[];
} {
  if (!vendor) return { clause: "", params: [] };
  if (vendor === "datacom") {
    return { clause: "AND LOWER(TRIM(COALESCE(gerencia, ''))) = ?", params: ["datacom"] };
  }
  if (vendor === "tellabs") {
    return { clause: "AND LOWER(COALESCE(gerencia, '')) LIKE ?", params: ["%tellabs%"] };
  }
  return {
    clause:
      "AND LOWER(TRIM(COALESCE(gerencia, ''))) <> ? AND LOWER(COALESCE(gerencia, '')) NOT LIKE ?",
    params: ["datacom", "%tellabs%"],
  };
}

/** Fragmento SQL WHERE para DDD (`sem` = NULL/vazio). */
export function sdhDddSql(ddd: string | undefined): { clause: string; params: string[] } {
  if (!ddd) return { clause: "", params: [] };
  if (ddd === SDH_DDD_EMPTY) {
    return { clause: "AND (ddd IS NULL OR TRIM(ddd) = '')", params: [] };
  }
  return { clause: "AND TRIM(COALESCE(ddd, '')) = ?", params: [ddd] };
}

/** Fragmento SQL WHERE para status de tratativa. */
export function sdhStatusSql(status: SdhStatusFilter | undefined): {
  clause: string;
  params: [];
} {
  if (status === "pendente") return { clause: "AND em_tratativa = 0", params: [] };
  if (status === "em-tratativa") return { clause: "AND em_tratativa = 1", params: [] };
  return { clause: "", params: [] };
}

/** Formata KPI DDD como `91 - PA`. */
export function sdhDddLabel(ddd: string): string {
  if (ddd === SDH_DDD_EMPTY) return "Sem DDD";
  return operationalDddLabel(ddd);
}
