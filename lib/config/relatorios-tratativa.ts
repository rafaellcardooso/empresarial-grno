import type { TratativaReportScope } from "@/lib/models/tratativa-report";
import type { TratativaRecordKind } from "@/lib/models/tratativa";

/** Rótulos UI dos tipos de evento em relatórios de tratativa. */
export const TRATATIVA_REPORT_EVENT_LABELS: Record<string, string> = {
  START: "Chamados assumidos",
  ACIONAMENTO: "VTs registradas",
  VALIDACAO_SOLICITADA: "Validação solicitada",
  VALIDACAO: "Validações",
  VALIDACAO_APROVADA: "Validação aprovada",
  VALIDACAO_REPROVADA: "Validação reprovada",
  CONCLUIDA: "Concluídos",
  RELEASE: "Liberações",
};

/** Converte escopo em filtro SQL (null = todos). */
export function sqlRecordKindFilter(scope: TratativaReportScope): TratativaRecordKind | null {
  return scope === "ALL" ? null : scope;
}
