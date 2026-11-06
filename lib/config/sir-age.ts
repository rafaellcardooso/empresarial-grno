/** REC: verde abaixo deste limiar; amarelo + atenção a partir daqui até o SLA. */
export const REC_WARN_HOURS = 2;

/** SLA de REC em horas: vermelho + pop-up de estouro a partir daqui. */
export const REC_SLA_HOURS = 4;

/** RAL: verde abaixo deste limiar; amarelo + atenção a partir daqui até o SLA. */
export const RAL_WARN_HOURS = 2;

/** SLA de RAL em horas: vermelho + pop-up de estouro a partir daqui. */
export const RAL_SLA_HOURS = 6;

export type SirAgeBand = {
  tone: "ok" | "warn" | "over";
  label: string;
  range: string;
};

/** Formata hora cheia como `HH:00`. */
function formatHourStart(hours: number): string {
  return `${String(hours).padStart(2, "0")}:00`;
}

/** Formata o fim do intervalo imediatamente antes de `hours` como `HH:59`. */
function formatHourEndBefore(hours: number): string {
  return `${String(Math.max(hours - 1, 0)).padStart(2, "0")}:59`;
}

/** Horas a partir das quais dispara o alerta de atenção (amarelo). */
export function sirWarnHours(domain: "RAL" | "REC"): number {
  return domain === "RAL" ? RAL_WARN_HOURS : REC_WARN_HOURS;
}

/** SLA (horas) do domínio SIR para alarme de estouro e badge. */
export function sirSlaHours(domain: "RAL" | "REC"): number {
  return domain === "RAL" ? RAL_SLA_HOURS : REC_SLA_HOURS;
}

/** Rótulo da legenda: família REC inclui DSR e TCQ (mesmos limiares). */
export function sirAgeLegendDomainLabel(domain: "RAL" | "REC"): string {
  return domain === "RAL" ? "RAL" : "REC / DSR / TCQ";
}

/**
 * Faixas de idade exibidas na legenda (alinham a cor da linha na tabela).
 * Verde: até (warn−1):59 · Amarelo: warn:00–(sla−1):59 · Vermelho: a partir de sla:00.
 */
export function sirAgeBands(domain: "RAL" | "REC"): SirAgeBand[] {
  const warn = sirWarnHours(domain);
  const sla = sirSlaHours(domain);
  return [
    {
      tone: "ok",
      label: "Verde",
      range: `Até ${formatHourEndBefore(warn)}`,
    },
    {
      tone: "warn",
      label: "Amarelo",
      range: `${formatHourStart(warn)} – ${formatHourEndBefore(sla)}`,
    },
    {
      tone: "over",
      label: "Vermelho",
      range: `Acima de ${formatHourStart(sla)}`,
    },
  ];
}
