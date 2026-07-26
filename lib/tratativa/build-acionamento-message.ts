import type {
  AcionamentoContext,
  AcionamentoTechnicianInput,
  BsodAcionamentoContext,
} from "@/lib/models/acionamento";
import { buildSirAcionamentoMessage } from "@/lib/tratativa/build-sir-acionamento-message";

/** Linha LABEL: valor (rótulo sempre maiúsculo). */
function fieldLine(label: string, value?: string | null): string {
  return `${label.toUpperCase()}: ${value?.trim() ?? ""}`;
}

/** Normaliza MAC para exibição em maiúsculas. */
function formatMac(value?: string | null): string {
  return (value?.trim() ?? "").toUpperCase();
}

/** Normaliza status do monitor para mensagem. */
function formatStatus(value?: string | null): string {
  return (value?.trim() ?? "").toUpperCase();
}

/** Monta bloco do técnico omitindo campos vazios (janela sempre inclusa). */
function buildTechnicianBlock(technician: AcionamentoTechnicianInput): string[] {
  const rows: Array<[string, string]> = [
    ["JANELA", technician.janela],
    ["NOME", technician.nome],
    ["CIDADE", technician.cidade],
    ["UN", technician.un],
    ["LOGIN", technician.login],
    ["RG", technician.rg],
    ["CPF", technician.cpf],
  ];

  return rows
    .filter(([label, value]) => label === "JANELA" || Boolean(value?.trim()))
    .map(([label, value]) => fieldLine(label, value));
}

/** Monta bloco do equipamento/cliente na ordem operacional BSOD. */
function buildEquipmentBlock(context: BsodAcionamentoContext, sintoma: string): string[] {
  return [
    fieldLine("CMTS", context.cmts),
    fieldLine("NODE", context.node),
    fieldLine("CONTRATO", context.contrato),
    fieldLine("MAC", formatMac(context.mac ?? context.recordKey)),
    fieldLine("PROFILE", context.profile),
    fieldLine("STATUS", formatStatus(context.monitorLabel)),
    "",
    fieldLine("ENDEREÇO", context.address),
    fieldLine("SINTOMA", sintoma),
  ];
}

/** Monta mensagem BSOD/PME para acionamento de VT via WhatsApp. */
export function buildBsodAcionamentoMessage(
  context: BsodAcionamentoContext,
  technician: AcionamentoTechnicianInput,
): string {
  const sintoma =
    technician.sintoma?.trim() ||
    context.sintoma?.trim() ||
    formatStatus(context.monitorLabel) ||
    "";

  const technicianBlock = buildTechnicianBlock(technician);
  const equipmentBlock = buildEquipmentBlock(context, sintoma);

  const lines: string[] = [
    "Prezados, solicito agendamento de visita técnica (VT) conforme dados abaixo.",
    "",
    "TÉCNICO",
    ...technicianBlock,
    "",
    "CLIENTE",
    ...equipmentBlock,
  ];

  return lines.join("\n").trim();
}

/** Monta mensagem de acionamento conforme o tipo de registro. */
export function buildAcionamentoMessage(
  context: AcionamentoContext,
  technician: AcionamentoTechnicianInput,
): string {
  if (context.recordKind === "BSOD") {
    return buildBsodAcionamentoMessage(context, technician);
  }
  return buildSirAcionamentoMessage(context, technician);
}

/** Sugere janela horária da próxima hora cheia (fuso local do servidor). */
export function suggestAcionamentoJanela(reference = new Date()): string {
  const start = new Date(reference);
  start.setMinutes(0, 0, 0);
  if (reference.getMinutes() > 0 || reference.getSeconds() > 0) {
    start.setHours(start.getHours() + 1);
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });

  return `${formatTime(start)} - ${formatTime(end)}`;
}

/** Deriva texto de sintoma a partir do status de monitoramento PME. */
export function bsodSintomaFromMonitorLabel(monitorLabel?: string | null): string {
  const label = monitorLabel?.trim().toLowerCase() ?? "";
  if (label.includes("offline")) return "offline";
  if (label.includes("sem leitura")) return "sem leitura";
  if (label.includes("online")) return "online";
  return "";
}
