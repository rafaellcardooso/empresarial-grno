import nodemailer from "nodemailer";

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** Monta o cabeçalho From (nome de exibição opcional via SMTP_FROM_NAME). */
function formatSmtpFrom(): string {
  const address = (process.env.SMTP_FROM || "").trim();
  const name = (process.env.SMTP_FROM_NAME || "").trim();
  if (!name) return address;
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}

/** Indica se SMTP está configurado no ambiente. */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

/** Envia e-mail via SMTP configurado; lança se SMTP ausente. */
export async function sendMail(input: SendMailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP não configurado");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });

  await transporter.sendMail({
    from: formatSmtpFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br>"),
  });
}

/** Monta URL absoluta para links em e-mails. */
export function getAppPublicUrl(path: string): string {
  const base = (process.env.APP_PUBLIC_URL || "http://192.168.95.40/empresarial").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
