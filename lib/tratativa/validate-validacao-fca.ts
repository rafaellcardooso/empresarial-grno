import type { ValidacaoFcaInput } from "@/lib/models/validacao";

/** Indica se Fato, Causa e Ação estão preenchidos. */
export function isValidacaoFcaComplete(fca: ValidacaoFcaInput): boolean {
  return getValidacaoFcaValidationError(fca) === null;
}

/** Retorna mensagem quando algum campo FCA obrigatório está ausente. */
export function getValidacaoFcaValidationError(fca: ValidacaoFcaInput): string | null {
  const missing: string[] = [];
  if (!fca.fato.trim()) missing.push("fato");
  if (!fca.causa.trim()) missing.push("causa");
  if (!fca.acao.trim()) missing.push("ação");
  if (missing.length === 0) return null;
  return `Informe o FCA: ${missing.join(", ")}.`;
}

/** Monta texto estruturado do FCA para gravar em message_text. */
export function formatValidacaoFcaMessage(fca: ValidacaoFcaInput): string {
  return [
    `FATO: ${fca.fato.trim()}`,
    `CAUSA: ${fca.causa.trim()}`,
    `AÇÃO: ${fca.acao.trim()}`,
  ].join("\n");
}

/** Extrai Fato, Causa e Ação de `message_text` do evento VALIDACAO. */
export function parseValidacaoFcaMessage(
  messageText: string | null | undefined,
): ValidacaoFcaInput | null {
  if (!messageText?.trim()) return null;

  const fato = extractLabeledField(messageText, "FATO");
  const causa = extractLabeledField(messageText, "CAUSA");
  const acao = extractLabeledField(messageText, "AÇÃO") ?? extractLabeledField(messageText, "ACAO");

  if (!fato && !causa && !acao) return null;

  return {
    fato: fato ?? "",
    causa: causa ?? "",
    acao: acao ?? "",
  };
}

/** Lê valor de linha `LABEL: valor` em texto multilinha. */
function extractLabeledField(text: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^${escaped}\\s*:\\s*(.*)$`, "im"));
  const value = match?.[1]?.trim();
  return value ? value : null;
}
