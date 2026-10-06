import {
  FCA_COPY,
  FCA_HEADER_FIELDS,
  FCA_RESPONSAVEL_LABEL,
  FCA_TEXT_FIELDS,
} from "@/lib/config/fca";
import { formatFcaDateTime, parseDateTimeLocal, parseSirDateTime } from "@/lib/fca/datetime";
import type { FcaHeaderFields, FcaTextFields } from "@/lib/models/fca";

/**
 * Retorna o motivo que impede a cópia do FCA, ou null quando pronto:
 * Normalização, Fato, Causa e Ação obrigatórios; normalização entre a abertura e o momento atual.
 */
export function getFcaCopyBlocker(
  header: FcaHeaderFields,
  text: FcaTextFields,
  now: Date = new Date(),
): string | null {
  const normalizacao = parseDateTimeLocal(header.normalizacao);
  const hasText = FCA_TEXT_FIELDS.every((field) => text[field.key].trim() !== "");
  if (!normalizacao || !hasText) return FCA_COPY.copyHint;

  if (normalizacao.getTime() > now.getTime()) return FCA_COPY.normalizacaoInFuture;
  const abertura = parseSirDateTime(header.abertura);
  if (abertura && normalizacao.getTime() < abertura.getTime()) {
    return FCA_COPY.normalizacaoBeforeAbertura;
  }
  return null;
}

/** Monta o texto do FCA para cópia: cabeçalho com campos preenchidos, responsável e blocos Fato/Causa/Ação. */
export function buildFcaText(
  header: FcaHeaderFields,
  text: FcaTextFields,
  responsavel: string,
): string {
  const headerLines = FCA_HEADER_FIELDS.filter((field) => header[field.key].trim()).map((field) => {
    const value = header[field.key].trim();
    return `${field.label}: ${field.type === "datetime-local" ? formatFcaDateTime(value) : value}`;
  });
  if (responsavel) headerLines.push(`${FCA_RESPONSAVEL_LABEL}: ${responsavel}`);

  const textBlocks = FCA_TEXT_FIELDS.map(
    (field) => `${field.label.toUpperCase()}:\n${text[field.key].trim()}`,
  );
  return ["FCA", ...headerLines, "", textBlocks.join("\n\n")].join("\n");
}
