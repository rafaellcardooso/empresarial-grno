/**
 * Extrai valor de `LABEL: valor` no texto de detalhes do SIR, restrito à mesma linha
 * (label vazio não captura a linha seguinte).
 */
export function extractDetailField(
  text: string | null | undefined,
  labels: string[],
): string | null {
  if (!text) return null;
  for (const label of labels) {
    const pattern = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(
      new RegExp(`(?:^|[\\n\\r])[ \\t]*${pattern}[ \\t]*:[ \\t]*([^\\n\\r]*)`, "i"),
    );
    const value = match?.[1]?.replace(/\s+/g, " ").trim();
    if (value) return value;
  }
  return null;
}

/** Monta endereço a partir dos campos de detalhes (logradouro, número, bairro, cidade, UF). */
export function extractDetailAddress(text: string | null | undefined): string | null {
  const parts = [
    extractDetailField(text, ["ENDEREÇO", "ENDERECO"]),
    extractDetailField(text, ["Número", "Numero"]),
    extractDetailField(text, ["Bairro"]),
    extractDetailField(text, ["Cidade"]),
    extractDetailField(text, ["UF"]),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(", ") : null;
}
