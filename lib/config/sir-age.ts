/** SLA de REC em horas: dentro do limiar a linha fica verde; ao estourar, vermelha + pop-up. */
export const REC_SLA_HOURS = 2;

/** SLA de RAL em horas: dentro do limiar a linha fica verde; ao estourar, vermelha + pop-up. */
export const RAL_SLA_HOURS = 6;

/** SLA (horas) do domínio SIR para coloração da tabela e alarme pop-up. */
export function sirSlaHours(domain: "RAL" | "REC"): number {
  return domain === "RAL" ? RAL_SLA_HOURS : REC_SLA_HOURS;
}
