import { isSmtpConfigured, sendMail } from "@/lib/email/send-mail";
import { listActiveStaffEmails } from "@/lib/queries/app-users";

const PORTAL_NAME = "Empresarial";

type RegistrationAlertInput = {
  name: string;
  corporateId: string;
  email?: string | null;
  homeUf?: string | null;
};

type DecisionMailInput = {
  name: string;
  corporateId: string;
  email?: string | null;
};

/** Envia e-mail sem lançar; retorna false se SMTP/destinatário ausente ou falha. */
async function sendSafeMail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false;
  const to = input.to.trim().toLowerCase();
  if (!to) return false;
  try {
    await sendMail({ to, subject: input.subject, text: input.text });
    return true;
  } catch (error) {
    console.error("[email] falha no envio:", error);
    return false;
  }
}

/** Alerta staff ativos por e-mail sobre novo cadastro; falha de SMTP não propaga. */
export async function notifyAdminsNewRegistration(input: RegistrationAlertInput): Promise<void> {
  if (!isSmtpConfigured()) return;

  const recipients = [...new Set(await listActiveStaffEmails())];
  if (recipients.length === 0) {
    console.warn("[email] SMTP ok, mas nenhum STAFF ativo com e-mail cadastrado.");
    return;
  }

  const lines = [
    `Novo cadastro pendente em ${PORTAL_NAME}.`,
    "",
    `Nome: ${input.name}`,
    `Login: ${input.corporateId}`,
    `E-mail: ${input.email?.trim() || "(não informado)"}`,
    `UF: ${input.homeUf?.trim() || "(não informada)"}`,
    "",
    "Aprovar em: Administração → Usuários (acesse o portal pela VPN).",
  ];

  await sendSafeMail({
    to: recipients.join(", "),
    subject: `[${PORTAL_NAME}] Nova solicitação de acesso — ${input.corporateId}`,
    text: lines.join("\n"),
  });
}

/** Avisa o solicitante que o cadastro foi aprovado. */
export async function notifyUserRegistrationApproved(input: DecisionMailInput): Promise<void> {
  const email = input.email?.trim() || "";
  if (!email) return;

  const lines = [
    `Olá, ${input.name}.`,
    "",
    `Seu cadastro em ${PORTAL_NAME} foi aprovado.`,
    `Login: ${input.corporateId}`,
    "",
    "Acesse o portal pela VPN e faça login.",
  ];

  await sendSafeMail({
    to: email,
    subject: `[${PORTAL_NAME}] Cadastro aprovado — ${input.corporateId}`,
    text: lines.join("\n"),
  });
}

/** Avisa o solicitante que o cadastro foi rejeitado. */
export async function notifyUserRegistrationRejected(input: DecisionMailInput): Promise<void> {
  const email = input.email?.trim() || "";
  if (!email) return;

  const lines = [
    `Olá, ${input.name}.`,
    "",
    `Seu cadastro em ${PORTAL_NAME} foi rejeitado.`,
    `Login solicitado: ${input.corporateId}`,
    "",
    "Se precisar de acesso, fale com um administrador ou envie um novo cadastro.",
  ];

  await sendSafeMail({
    to: email,
    subject: `[${PORTAL_NAME}] Cadastro rejeitado — ${input.corporateId}`,
    text: lines.join("\n"),
  });
}
