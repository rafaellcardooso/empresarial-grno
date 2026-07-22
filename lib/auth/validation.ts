const CORPORATE_ID_RE = /^[A-Z][A-Z0-9]{3,11}$/;

/** Normaliza matrícula corporativa (ex.: f104262 → F104262). */
export function normalizeCorporateId(value: string): string {
  return value.trim().toUpperCase();
}

/** Valida formato de matrícula corporativa Claro (ex.: F104262). */
export function isValidCorporateId(value: string): boolean {
  return CORPORATE_ID_RE.test(normalizeCorporateId(value));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida formato de e-mail (opcional — contato/reset). */
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Valida senha mínima (8+ chars, letra e número). */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

/** Mensagem de requisito de senha para UI. */
export const PASSWORD_REQUIREMENTS = "Mínimo 8 caracteres, com letras e números.";

/** Mensagem de formato de matrícula para UI. */
export const CORPORATE_ID_HINT = "Matrícula corporativa (ex.: F104262).";

/** Extrai mensagem de erro de unknown. */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Parse JSON do body ou null. */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
