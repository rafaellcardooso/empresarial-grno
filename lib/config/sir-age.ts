/** REC: verde abaixo deste limiar; amarelo + atenção a partir daqui até o SLA. */
export const REC_WARN_HOURS = 1;

/** SLA de REC em horas: vermelho + pop-up de estouro a partir daqui. */
export const REC_SLA_HOURS = 2;

/** RAL: verde abaixo deste limiar; amarelo + atenção a partir daqui até o SLA. */
export const RAL_WARN_HOURS = 2;

/** SLA de RAL em horas: vermelho + pop-up de estouro a partir daqui. */
export const RAL_SLA_HOURS = 6;

/** Horas a partir das quais dispara o alerta de atenção (amarelo). */
export function sirWarnHours(domain: "RAL" | "REC"): number {
  return domain === "RAL" ? RAL_WARN_HOURS : REC_WARN_HOURS;
}

/** SLA (horas) do domínio SIR para alarme de estouro e badge. */
export function sirSlaHours(domain: "RAL" | "REC"): number {
  return domain === "RAL" ? RAL_SLA_HOURS : REC_SLA_HOURS;
}
