/** Nome do cookie de sessão HTTP-only. */
export const SESSION_COOKIE_NAME = "emp_session";

/** Rotas públicas (sem login). */
export const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
] as const;

/** Prefixos de API públicas (bot Telegram + health). */
export const PUBLIC_API_PREFIXES = [
  "/api/rals",
  "/api/recs",
  "/api/bsod",
  "/api/saude",
  "/api/sir",
] as const;

/** Endpoints de auth abertos. */
export const PUBLIC_AUTH_API_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
] as const;

/** Versão atual do tour (incrementar ao alterar passos). */
export const APP_TOUR_VERSION = Number(process.env.APP_TOUR_VERSION || "1");
