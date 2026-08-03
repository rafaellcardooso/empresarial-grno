import { listOperationalUfs, operationalDddLabel } from "@/lib/config/locations";

/** Vendor de filtro na página SDH. */
export type SdhVendorFilter = "datacom" | "tellabs" | "alcatel";
export type SdhStatusFilter = "pendente" | "em-tratativa";

export const SDH_VENDOR_FILTERS: SdhVendorFilter[] = ["datacom", "tellabs", "alcatel"];

export const SDH_VENDOR_LABELS: Record<SdhVendorFilter, string> = {
  datacom: "Datacom",
  tellabs: "Tellabs",
  alcatel: "Alcatel",
};

/** Tipos de alarme aceitos na exibição SDH (legado SPI, aplicam a todos os vendors). */
export const SDH_ALLOWED_ALARMES = [
  "loss of signal",
  "ais",
  "loss of frame",
  "fan failure",
  "fan degraded",
  "rdi",
  "stm-1 loss of input signal",
  "communication-transport  stm64 port  loss of frame",
  "equipment  fan  fan voltage feed b failure",
  "vc-4 loss of multiframe",
  "connection failed",
  "stm-1 ms remote defect indicator",
] as const;

/** Valor de query para DDD vazio. */
export const SDH_DDD_EMPTY = "sem";

type SdhVendorFields = {
  gerencia?: string | null;
  alarme?: string | null;
  uf?: string | null;
  ddd?: string | null;
  porta?: string | null;
  ne?: string | null;
};

/** Predicado compartilhado: alarme permitido + UF do escopo operacional do projeto. */
export function sdhCommonScopePredicate(alias = ""): { sql: string; params: string[] } {
  const a = alias ? `${alias}.alarme` : "alarme";
  const uf = alias ? `${alias}.uf` : "uf";
  const alarmPlaceholders = SDH_ALLOWED_ALARMES.map(() => "?").join(", ");
  const ufs = listOperationalUfs();
  const ufPlaceholders = ufs.map(() => "?").join(", ");
  return {
    sql: `
      LOWER(TRIM(COALESCE(${a}, ''))) IN (${alarmPlaceholders})
      AND UPPER(TRIM(COALESCE(${uf}, ''))) IN (${ufPlaceholders})
    `
      .replace(/\s+/g, " ")
      .trim(),
    params: [...SDH_ALLOWED_ALARMES, ...ufs],
  };
}

/** Predicado SQL Datacom (sem `AND` inicial). */
function sdhDatacomPredicate(alias = ""): { sql: string; params: string[] } {
  const col = alias ? `${alias}.gerencia` : "gerencia";
  return { sql: `LOWER(TRIM(COALESCE(${col}, ''))) = ?`, params: ["datacom"] };
}

/** Predicado SQL Tellabs (sem `AND` inicial). */
function sdhTellabsPredicate(alias = ""): { sql: string; params: string[] } {
  const col = alias ? `${alias}.gerencia` : "gerencia";
  return { sql: `LOWER(COALESCE(${col}, '')) LIKE ?`, params: ["%tellabs%"] };
}

/**
 * Predicado SQL Alcatel (gerência legado + exclusões de porta/NE).
 * Alarme e UF ficam no escopo comum (`sdhCommonScopePredicate`).
 */
export function sdhAlcatelPredicate(alias = ""): { sql: string; params: string[] } {
  const g = alias ? `${alias}.gerencia` : "gerencia";
  const porta = alias ? `${alias}.porta` : "porta";
  const ne = alias ? `${alias}.ne` : "ne";
  return {
    sql: `
      (
        LOWER(COALESCE(${g}, '')) LIKE ?
        OR LOWER(COALESCE(${g}, '')) LIKE ?
        OR LOWER(TRIM(COALESCE(${g}, ''))) BETWEEN ? AND ?
        OR LOWER(COALESCE(${g}, '')) LIKE ?
      )
      AND LOWER(COALESCE(${porta}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${porta}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${porta}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${porta}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${porta}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${ne}, '')) NOT LIKE ?
      AND LOWER(COALESCE(${ne}, '')) NOT LIKE ?
    `
      .replace(/\s+/g, " ")
      .trim(),
    params: [
      "%omsams%",
      "%shma%",
      "nmmaa1",
      "nmmaa5",
      "mwnmm%",
      "%mon%",
      "%vc12%",
      "%tu12%",
      "%-p%",
      "%-el%",
      "78%",
      "ppeat6g%",
    ],
  };
}

/** Indica se o alarme está no escopo comum (tipo permitido + UF do projeto). */
function matchesSdhCommonScope(row: SdhVendorFields): boolean {
  const alarme = (row.alarme ?? "").trim().toLowerCase();
  if (!(SDH_ALLOWED_ALARMES as readonly string[]).includes(alarme)) return false;
  const uf = (row.uf ?? "").trim().toUpperCase();
  return listOperationalUfs().includes(uf);
}

/** Classifica alarme nos vendors exibidos; fora do escopo retorna null. */
export function classifySdhVendor(row: SdhVendorFields): SdhVendorFilter | null {
  if (!matchesSdhCommonScope(row)) return null;

  const gerencia = (row.gerencia ?? "").trim().toLowerCase();
  if (gerencia === "datacom") return "datacom";
  if (gerencia.includes("tellabs")) return "tellabs";

  const g = (row.gerencia ?? "").toLowerCase();
  const gerenciaOk =
    g.includes("omsams") ||
    g.includes("shma") ||
    (g.trim() >= "nmmaa1" && g.trim() <= "nmmaa5") ||
    g.startsWith("mwnmm");
  if (!gerenciaOk) return null;

  const porta = (row.porta ?? "").toLowerCase();
  if (
    porta.includes("mon") ||
    porta.includes("vc12") ||
    porta.includes("tu12") ||
    porta.includes("-p") ||
    porta.includes("-el")
  ) {
    return null;
  }

  const ne = (row.ne ?? "").toLowerCase();
  if (ne.startsWith("78") || ne.startsWith("ppeat6g")) return null;

  return "alcatel";
}

/** Parseia vendor da query string; inválido retorna undefined (todos os exibidos). */
export function parseSdhVendorParam(raw: string | null | undefined): SdhVendorFilter | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === "datacom" || value === "tellabs" || value === "alcatel") return value;
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

/** Fragmento SQL WHERE para vendor (placeholders `?`). Sem vendor = Datacom ∪ Tellabs ∪ Alcatel. */
export function sdhVendorSql(vendor: SdhVendorFilter | undefined): {
  clause: string;
  params: string[];
} {
  const common = sdhCommonScopePredicate();
  const datacom = sdhDatacomPredicate();
  const tellabs = sdhTellabsPredicate();
  const alcatel = sdhAlcatelPredicate();

  if (!vendor) {
    return {
      clause: `AND (${common.sql}) AND ((${datacom.sql}) OR (${tellabs.sql}) OR (${alcatel.sql}))`,
      params: [...common.params, ...datacom.params, ...tellabs.params, ...alcatel.params],
    };
  }
  if (vendor === "datacom") {
    return {
      clause: `AND (${common.sql}) AND (${datacom.sql})`,
      params: [...common.params, ...datacom.params],
    };
  }
  if (vendor === "tellabs") {
    return {
      clause: `AND (${common.sql}) AND (${tellabs.sql})`,
      params: [...common.params, ...tellabs.params],
    };
  }
  return {
    clause: `AND (${common.sql}) AND (${alcatel.sql})`,
    params: [...common.params, ...alcatel.params],
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
