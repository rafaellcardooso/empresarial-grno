import { RAL_SLA_HOURS, RAL_WARN_HOURS, REC_SLA_HOURS, REC_WARN_HOURS } from "@/lib/config/sir-age";
import { parseAppDateTime } from "@/lib/format/datetime";

export type SirAgeTone = "ok" | "warn" | "over";

/**
 * Classifica a idade do chamado para colorir a linha da tabela.
 * REC: verde abaixo de 2h, amarelo de 2h a 4h, vermelho a partir de 4h.
 * RAL: verde abaixo de 2h, amarelo de 2h a 6h, vermelho a partir de 6h.
 * Retorna null quando a data é inválida ou o registro não está ATIVO.
 */
export function sirAgeTone(
  domain: "RAL" | "REC",
  abertura: string | null | undefined,
  status: string | null | undefined,
  nowMs: number = Date.now(),
): SirAgeTone | null {
  if (
    String(status ?? "")
      .trim()
      .toUpperCase() !== "ATIVO"
  ) {
    return null;
  }
  const opened = parseAppDateTime(abertura);
  if (!opened) return null;
  const ageHours = (nowMs - opened.getTime()) / 3_600_000;
  if (ageHours < 0) return "ok";

  const warnHours = domain === "RAL" ? RAL_WARN_HOURS : REC_WARN_HOURS;
  const slaHours = domain === "RAL" ? RAL_SLA_HOURS : REC_SLA_HOURS;
  if (ageHours < warnHours) return "ok";
  if (ageHours < slaHours) return "warn";
  return "over";
}

/** Classe CSS da linha conforme o SLA do chamado. */
export function sirAgeRowClassName(
  domain: "RAL" | "REC",
  row: Record<string, unknown>,
  nowMs?: number,
): string | undefined {
  const tone = sirAgeTone(
    domain,
    row.abertura as string | null | undefined,
    row.status as string | null | undefined,
    nowMs,
  );
  return tone ? `sir-age--${tone}` : undefined;
}
