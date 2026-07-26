import type { AcionamentoTechnicianInput, SirAcionamentoContext } from "@/lib/models/acionamento";

/** Linha LABEL: valor para campos do técnico SIR. */
function technicianFieldLine(label: string, value?: string | null): string {
  return `${label}: ${value?.trim() ?? ""}`.trimEnd();
}

/** Monta bloco de dados do técnico no formato SIR (campos sempre visíveis). */
function buildSirTechnicianBlock(technician: AcionamentoTechnicianInput): string[] {
  return [
    technicianFieldLine("JANELA", technician.janela),
    "",
    technicianFieldLine("NOME", technician.nome),
    technicianFieldLine("CIDADE", technician.cidade),
    technicianFieldLine("UN", technician.un),
    technicianFieldLine("LOGIN", technician.login),
    technicianFieldLine("RG", technician.rg),
    technicianFieldLine("CPF", technician.cpf),
  ];
}

/** Monta bloco do registro SIR (REC/RAL) conforme modelo operacional. */
function buildSirRecordBlock(context: SirAcionamentoContext, sintoma: string): string[] {
  const designacao = context.designacao?.trim() ?? "";
  const razaoSocial = context.razaoSocial?.trim() ?? "";

  return [
    technicianFieldLine("CONTRATO NETSALES", context.contratoNetsales),
    context.numRecup,
    designacao ? `Designação:${designacao}` : "Designação:",
    razaoSocial ? `Razão Social:${razaoSocial}` : "Razão Social:",
    technicianFieldLine("ENDEREÇO", context.endereco),
    tabFieldLine("Complemento", context.complemento),
    tabFieldLine("Número", context.numero),
    tabFieldLine("Bairro", context.bairro),
    tabFieldLine("Cidade", context.cidade),
    tabFieldLine("UF", context.uf),
    tabFieldLine("CEP", context.cep),
    technicianFieldLine("Reclamante", context.reclamante),
    technicianFieldLine("SINTOMA", sintoma),
  ];
}

/** Linha com tab após dois-pontos, como no tooltip SIR legado. */
function tabFieldLine(label: string, value?: string | null): string {
  return `${label}:\t${value?.trim() ?? ""}`.trimEnd();
}

/** Monta mensagem RAL/REC para acionamento de VT via WhatsApp. */
export function buildSirAcionamentoMessage(
  context: SirAcionamentoContext,
  technician: AcionamentoTechnicianInput,
): string {
  const sintoma =
    technician.sintoma?.trim() ||
    context.sintoma?.trim() ||
    context.descricao?.trim() ||
    "sem sinal.";

  const lines: string[] = [];
  const mention = technician.whatsappTarget?.trim();
  if (mention) {
    lines.push(mention.startsWith("@") ? mention : `@${mention}`);
  }

  lines.push(
    "Favor informar dados do técnico para VT:",
    ...buildSirTechnicianBlock(technician),
    "",
    "",
    ...buildSirRecordBlock(context, sintoma),
  );

  return lines.join("\n").trim();
}

/** Sugere sintoma inicial a partir do contexto SIR. */
export function sirSintomaFromContext(context: SirAcionamentoContext): string {
  if (context.sintoma?.trim()) return context.sintoma.trim();
  if (context.recordKind === "RAL" && context.descricao?.trim()) return context.descricao.trim();
  return "sem sinal.";
}
