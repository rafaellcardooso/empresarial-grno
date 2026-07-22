import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { SIR_RECORD_STATUS, type SirRecordStatus } from "@/lib/models/sir";

export type SirStatusFilter = "ativo" | "encerrado" | "todos";

export type SirRecordScope = "ral" | "rec";

const SIR_STATUS_SCOPE_LABELS: Record<SirRecordScope, Record<SirStatusFilter, string>> = {
  ral: {
    ativo: "ABERTAS",
    encerrado: "ENCERRADAS",
    todos: "TODAS",
  },
  rec: {
    ativo: "ABERTOS",
    encerrado: "ENCERRADOS",
    todos: "TODOS",
  },
};

/** Valida chave de filtro `status` na URL SIR. */
export function isSirStatusFilter(value?: string): value is SirStatusFilter {
  return value === "ativo" || value === "encerrado" || value === "todos";
}

/** Normaliza query string `status` (padrão: ativo). */
export function sirStatusFromParam(param?: string): SirStatusFilter {
  return isSirStatusFilter(param) ? param : "ativo";
}

/** Rótulo de status conforme escopo RAL ou REC (ex.: ABERTAS, ENCERRADOS). */
export function sirStatusLabelForScope(
  scope: SirRecordScope,
  filter: SirStatusFilter = "ativo",
): string {
  return SIR_STATUS_SCOPE_LABELS[scope][filter];
}

/** Rótulo de KPI com escopo (ex.: RAL · ABERTAS). */
export function sirScopeStatusKpiLabel(
  scope: SirRecordScope,
  filter: SirStatusFilter = "ativo",
): string {
  const prefix = scope === "ral" ? "RAL" : "REC";
  return `${prefix} · ${sirStatusLabelForScope(scope, filter)}`;
}

/** Rótulo de KPI REC/DSR/TCQ com status (ex.: REC/DSR/TCQ · ABERTOS). */
export function sirRecScopeStatusKpiLabel(filter: SirStatusFilter = "ativo"): string {
  return `${METRIC_LABELS.sir.recScope} · ${sirStatusLabelForScope("rec", filter)}`;
}

/** Rótulo legível do filtro de status SIR (alias de ABERTAS/ABERTOS). */
export function sirStatusFilterLabel(
  param?: SirStatusFilter,
  scope: SirRecordScope = "rec",
): string {
  const filter = param ?? "ativo";
  return sirStatusLabelForScope(scope, filter);
}

/** Converte filtro UI em valor SQL de status ou null para todos. */
export function sirRecordStatusFromFilter(filter: SirStatusFilter): SirRecordStatus | null {
  if (filter === "encerrado") return SIR_RECORD_STATUS.closed;
  if (filter === "ativo") return SIR_RECORD_STATUS.active;
  return null;
}
