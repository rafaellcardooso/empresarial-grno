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

const REPORT_KINDS: TratativaReportScope[] = ["ALL", "BSOD", "RAL", "REC"];

/** Valida escopo de relatório vindo da URL. */
export function isTratativaReportScope(value?: string): value is TratativaReportScope {
  return value != null && REPORT_KINDS.includes(value as TratativaReportScope);
}

/** Normaliza escopo da URL (padrão: BSOD — único fluxo completo hoje). */
export function tratativaReportScopeFromParam(param?: string): TratativaReportScope {
  return isTratativaReportScope(param) ? param : "BSOD";
}

/** Rótulo legível do escopo de registro. */
export function tratativaReportScopeLabel(scope: TratativaReportScope): string {
  if (scope === "ALL") return "Todos os registros";
  if (scope === "BSOD") return "Inventário BSOD";
  return scope;
}

/** Opções do filtro de escopo na UI. */
export function tratativaReportScopeOptions(): Array<{
  value: TratativaReportScope;
  label: string;
}> {
  return REPORT_KINDS.map((value) => ({
    value,
    label: tratativaReportScopeLabel(value),
  }));
}

/** Converte escopo em filtro SQL (null = todos). */
export function sqlRecordKindFilter(scope: TratativaReportScope): TratativaRecordKind | null {
  return scope === "ALL" ? null : scope;
}
