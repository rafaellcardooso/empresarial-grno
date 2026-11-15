import { getAppPublicUrl, isSmtpConfigured, sendMail } from "@/lib/email/send-mail";
import { listActiveStaffEmails } from "@/lib/queries/app-users";

const PORTAL_NAME = "Empresarial";

type RegistrationAlertInput = {
  name: string;
  corporateId: string;
  email?: string | null;
  homeUf?: string | null;
};

/** Alerta staff ativos por e-mail sobre novo cadastro; falha de SMTP não propaga. */
export async function notifyAdminsNewRegistration(input: RegistrationAlertInput): Promise<void> {
  if (!isSmtpConfigured()) return;

  const recipients = [...new Set(await listActiveStaffEmails())];
  if (recipients.length === 0) {
    console.warn("[email] SMTP ok, mas nenhum STAFF ativo com e-mail cadastrado.");
    return;
  }

  const approveUrl = getAppPublicUrl("/admin/usuarios");
  const lines = [
    `Novo cadastro pendente em ${PORTAL_NAME}.`,
    "",
    `Nome: ${input.name}`,
    `Login: ${input.corporateId}`,
    `E-mail: ${input.email?.trim() || "(não informado)"}`,
    `UF: ${input.homeUf?.trim() || "(não informada)"}`,
    "",
    `Aprovar em: ${approveUrl}`,
  ];

  try {
    await sendMail({
      to: recipients.join(", "),
      subject: `[${PORTAL_NAME}] Nova solicitação de acesso — ${input.corporateId}`,
      text: lines.join("\n"),
    });
  } catch (error) {
    console.error("[email] falha ao notificar admins no cadastro:", error);
  }
}
