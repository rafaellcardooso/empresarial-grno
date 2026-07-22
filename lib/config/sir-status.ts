import { SIR_RECORD_STATUS, type SirRecordStatus } from "@/lib/models/sir";

export type SirStatusFilter = "ativo" | "encerrado" | "todos";

const SIR_STATUS_FILTER_LABELS: Record<SirStatusFilter, string> = {
  ativo: "EM ABERTO",
  encerrado: "ENCERRADOS",
  todos: "TODOS",
};

/** Valida chave de filtro `status` na URL SIR. */
export function isSirStatusFilter(value?: string): value is SirStatusFilter {
  return value === "ativo" || value === "encerrado" || value === "todos";
}

/** Normaliza query string `status` (padrão: ativo). */
export function sirStatusFromParam(param?: string): SirStatusFilter {
  return isSirStatusFilter(param) ? param : "ativo";
}

/** Rótulo legível do filtro de status SIR. */
export function sirStatusFilterLabel(param?: SirStatusFilter): string {
  if (!param) return SIR_STATUS_FILTER_LABELS.ativo;
  return SIR_STATUS_FILTER_LABELS[param];
}

/** Converte filtro UI em valor SQL de status ou null para todos. */
export function sirRecordStatusFromFilter(filter: SirStatusFilter): SirRecordStatus | null {
  if (filter === "encerrado") return SIR_RECORD_STATUS.closed;
  if (filter === "ativo") return SIR_RECORD_STATUS.active;
  return null;
}
