import {
  HIDDEN_DDDS,
  isDddHidden,
  listOperationalUfs,
  operationalDddLabel,
} from "@/lib/config/locations";
import { SDH_ALLOWED_ALARMES, SDH_DATACOM_ALLOWED_ALARMES } from "@/lib/config/sdh-alarms";

/** Vendor de filtro na página SDH. */
export type SdhVendorFilter = "datacom" | "tellabs" | "alcatel";
export type SdhStatusFilter = "pendente" | "em-tratativa";

export const SDH_VENDOR_FILTERS: SdhVendorFilter[] = ["datacom", "tellabs", "alcatel"];

export const SDH_VENDOR_LABELS: Record<SdhVendorFilter, string> = {
  datacom: "Datacom",
  tellabs: "Tellabs",
  alcatel: "Alcatel",
};

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

/** Predicado compartilhado: UF do escopo operacional + DDD não oculto. */
export function sdhCommonScopePredicate(alias = ""): { sql: string; params: string[] } {
  const uf = alias ? `${alias}.uf` : "uf";
  const ddd = alias ? `${alias}.ddd` : "ddd";
  const ufs = listOperationalUfs();
  const ufPlaceholders = ufs.map(() => "?").join(", ");
  const hiddenPlaceholders = HIDDEN_DDDS.map(() => "?").join(", ");
  return {
    sql: `UPPER(TRIM(COALESCE(${uf}, ''))) IN (${ufPlaceholders}) AND TRIM(COALESCE(${ddd}, '')) NOT IN (${hiddenPlaceholders})`,
    params: [...ufs, ...HIDDEN_DDDS],
  };
}

/** Predicado SQL de tipo de alarme contra a lista informada (sem `AND` inicial). */
function sdhAlarmPredicate(
  allowed: readonly string[],
  alias = "",
): { sql: string; params: string[] } {
  const col = alias ? `${alias}.alarme` : "alarme";
  const placeholders = allowed.map(() => "?").join(", ");
  return { sql: `LOWER(TRIM(COALESCE(${col}, ''))) IN (${placeholders})`, params: [...allowed] };
}

/** Predicado SQL Datacom: gerência + tipos equivalentes da nomenclatura Datacom. */
function sdhDatacomPredicate(alias = ""): { sql: string; params: string[] } {
  const col = alias ? `${alias}.gerencia` : "gerencia";
  const alarm = sdhAlarmPredicate(SDH_DATACOM_ALLOWED_ALARMES, alias);
  return {
    sql: `LOWER(TRIM(COALESCE(${col}, ''))) = ? AND ${alarm.sql}`,
    params: ["datacom", ...alarm.params],
  };
}

/** Predicado SQL Tellabs: gerência + tipos de alarme legado. */
function sdhTellabsPredicate(alias = ""): { sql: string; params: string[] } {
  const col = alias ? `${alias}.gerencia` : "gerencia";
  const alarm = sdhAlarmPredicate(SDH_ALLOWED_ALARMES, alias);
  return {
    sql: `LOWER(COALESCE(${col}, '')) LIKE ? AND ${alarm.sql}`,
    params: ["%tellabs%", ...alarm.params],
  };
}

/** Predicado SQL Alcatel completo: gerência/exclusões + tipos de alarme legado. */
function sdhAlcatelScopedPredicate(alias = ""): { sql: string; params: string[] } {
  const base = sdhAlcatelPredicate(alias);
  const alarm = sdhAlarmPredicate(SDH_ALLOWED_ALARMES, alias);
  return { sql: `${base.sql} AND ${alarm.sql}`, params: [...base.params, ...alarm.params] };
}

/**
 * Predicado SQL Alcatel (gerência legado + exclusões de porta/NE).
 * Tipo de alarme em `sdhAlcatelScopedPredicate`; UF/DDD no escopo comum.
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

/** Indica se o alarme está no escopo comum (UF do projeto + DDD não oculto). */
function matchesSdhCommonScope(row: SdhVendorFields): boolean {
  if (isDddHidden(row.ddd)) return false;
  const uf = (row.uf ?? "").trim().toUpperCase();
  return listOperationalUfs().includes(uf);
}

/** Indica se o tipo de alarme consta na lista informada (comparação normalizada). */
function isAlarmAllowed(row: SdhVendorFields, allowed: readonly string[]): boolean {
  return allowed.includes((row.alarme ?? "").trim().toLowerCase());
}

/** Classifica alarme nos vendors exibidos; fora do escopo retorna null. */
export function classifySdhVendor(row: SdhVendorFields): SdhVendorFilter | null {
  if (!matchesSdhCommonScope(row)) return null;

  const gerencia = (row.gerencia ?? "").trim().toLowerCase();
  if (gerencia === "datacom") {
    return isAlarmAllowed(row, SDH_DATACOM_ALLOWED_ALARMES) ? "datacom" : null;
  }
  if (!isAlarmAllowed(row, SDH_ALLOWED_ALARMES)) return null;
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

/** Normaliza filtro DDD da URL (`sem` = vazio); DDD oculto retorna undefined. */
export function parseSdhDddParam(raw: string | null | undefined): string | undefined {
  if (raw == null || raw === "") return undefined;
  const value = raw.trim();
  return isDddHidden(value) ? undefined : value;
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
  const alcatel = sdhAlcatelScopedPredicate();

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
