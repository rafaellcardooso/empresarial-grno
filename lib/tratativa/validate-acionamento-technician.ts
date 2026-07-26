import type { AcionamentoTechnicianInput } from "@/lib/models/acionamento";

const REQUIRED_TECHNICIAN_FIELDS: Array<{
  key: keyof Pick<AcionamentoTechnicianInput, "nome" | "cidade" | "login" | "rg">;
  label: string;
}> = [
  { key: "nome", label: "nome" },
  { key: "cidade", label: "cidade" },
  { key: "login", label: "login" },
  { key: "rg", label: "RG" },
];

type AcionamentoRequiredTechnicianInput = Pick<
  AcionamentoTechnicianInput,
  "janela" | "nome" | "cidade" | "login" | "rg"
>;

/** Indica se janela e dados mínimos do técnico estão preenchidos. */
export function isAcionamentoTechnicianComplete(
  technician: AcionamentoRequiredTechnicianInput,
): boolean {
  return getAcionamentoTechnicianValidationError(technician) === null;
}

/** Retorna mensagem quando campos obrigatórios do acionamento estão ausentes. */
export function getAcionamentoTechnicianValidationError(
  technician: AcionamentoRequiredTechnicianInput,
): string | null {
  if (!technician.janela.trim()) {
    return "Informe a janela de atendimento.";
  }

  const missing = REQUIRED_TECHNICIAN_FIELDS.filter(({ key }) => !technician[key]?.trim());
  if (missing.length === 0) return null;

  const labels = missing.map(({ label }) => label).join(", ");
  return `Informe os dados do técnico: ${labels}.`;
}
