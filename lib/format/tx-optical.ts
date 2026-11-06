import { formatNumberPtBr } from "@/lib/format/number";

/** Faixa de cor do DIF (span loss medido vs referência). */
export type TxDifRefTone = "critical" | "warn" | "ok" | "high" | "undefined";

/** Ordem de exibição dos badges TX no menu (mesma da legenda). */
export const TX_DIF_REF_TONES: readonly TxDifRefTone[] = [
  "critical",
  "warn",
  "ok",
  "high",
  "undefined",
] as const;

/** Prioridade do pior DIF do enlace (menor = mais grave). */
const TX_DIF_REF_PRIORITY: Record<TxDifRefTone, number> = {
  critical: 0,
  warn: 1,
  undefined: 2,
  high: 3,
  ok: 4,
};

/** Itens da legenda de DIF na listagem TX. */
export const TX_DIF_REF_LEGEND: ReadonlyArray<{
  tone: TxDifRefTone;
  label: string;
}> = [
  { tone: "critical", label: "≤ −4 dB" },
  { tone: "warn", label: "−4 a −2 dB" },
  { tone: "ok", label: "−2 a 0 dB" },
  { tone: "high", label: "> 0 dB" },
  { tone: "undefined", label: "Referência não definida" },
];

/** Converte valor óptico do banco em número finito, ou null. */
export function toOpticalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/** Formata potência/perda óptica em pt-BR (duas casas; mantém −99). */
export function formatOpticalValue(value: unknown): string {
  const num = toOpticalNumber(value);
  if (num == null) return "—";
  return formatNumberPtBr(num, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formata extensão do trecho em km (pt-BR). */
export function formatExtensaoKm(value: unknown): string {
  const num = toOpticalNumber(value);
  if (num == null) return "—";
  return formatNumberPtBr(num, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Classifica o DIF (ref − medido / valor GRB) para cor operacional.
 * −99 indica referência não definida no CSV.
 */
export function classifyDifRefTone(value: unknown): TxDifRefTone {
  const num = toOpticalNumber(value);
  if (num == null || num === -99) return "undefined";
  if (num <= -4) return "critical";
  if (num <= -2) return "warn";
  if (num <= 0) return "ok";
  return "high";
}

/** Retorna a faixa mais grave entre as duas direções do enlace. */
export function worstDifRefTone(...values: unknown[]): TxDifRefTone {
  let worst: TxDifRefTone = "ok";
  for (const value of values) {
    const tone = classifyDifRefTone(value);
    if (TX_DIF_REF_PRIORITY[tone] < TX_DIF_REF_PRIORITY[worst]) worst = tone;
  }
  return worst;
}
