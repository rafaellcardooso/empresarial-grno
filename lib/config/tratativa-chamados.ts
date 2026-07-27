import type { TratativaWorkflowStatus } from "@/lib/models/tratativa";

/** Status de chamado para listagem (pipeline ativo + concluído). */
export type TratativaChamadoStatus = TratativaWorkflowStatus | "concluido";

/** Filtro de URL/relatório para chamados por status. */
export type TratativaChamadoStatusFilter = TratativaChamadoStatus | "all";

/** Rótulos alinhados ao vocabulário operacional. */
export const TRATATIVA_CHAMADO_STATUS_LABELS: Record<TratativaChamadoStatus, string> = {
  em_tratativa: "Assumidos",
  acionado: "Registrados",
  validacao_pendente: "Validação pendente",
  validacao_reprovada: "Não validados",
  validado: "Validados",
  concluido: "Concluídos",
};

/** Ordem dos chips de filtro (Todos à parte). */
export const TRATATIVA_CHAMADO_STATUS_ORDER: TratativaChamadoStatus[] = [
  "em_tratativa",
  "acionado",
  "validacao_pendente",
  "validado",
  "validacao_reprovada",
  "concluido",
];

/** Valida parâmetro `status` da URL de chamados. */
export function parseTratativaChamadoStatusFilter(
  value?: string | null,
): TratativaChamadoStatusFilter {
  if (!value || value === "all") return "all";
  if (value in TRATATIVA_CHAMADO_STATUS_LABELS) {
    return value as TratativaChamadoStatus;
  }
  return "all";
}
