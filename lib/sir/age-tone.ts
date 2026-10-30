import { sirSlaHours } from "@/lib/config/sir-age";
import { parseAppDateTime } from "@/lib/format/datetime";

export type SirAgeTone = "ok" | "over";

/**
 * Classifica se o chamado está dentro ou fora do SLA a partir de `abertura`.
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
  return ageHours < sirSlaHours(domain) ? "ok" : "over";
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
