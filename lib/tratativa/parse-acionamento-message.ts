/** Extrai valor de campo `LABEL: valor` em mensagens de acionamento VT. */
export function parseAcionamentoMessageField(message: string, field: string): string | null {
  const normalizedField = field.trim().toUpperCase();
  if (!normalizedField) return null;

  for (const line of message.split(/\r?\n/)) {
    const match = line.match(/^([A-ZÀ-Ü0-9 /]+):\s*(.*)$/u);
    if (!match) continue;
    if (match[1].trim().toUpperCase() !== normalizedField) continue;
    const value = match[2].trim();
    return value || null;
  }

  return null;
}

/** Extrai cliente, contrato e sintoma de mensagem BSOD de acionamento. */
export function parseBsodAcionamentoAnalytics(message: string | null | undefined): {
  cliente: string | null;
  contrato: string | null;
  sintoma: string | null;
} {
  if (!message?.trim()) {
    return { cliente: null, contrato: null, sintoma: null };
  }

  return {
    cliente: parseAcionamentoMessageField(message, "CLIENTE"),
    contrato: parseAcionamentoMessageField(message, "CONTRATO"),
    sintoma: parseAcionamentoMessageField(message, "SINTOMA"),
  };
}
