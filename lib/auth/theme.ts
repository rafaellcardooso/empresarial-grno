import type { NextResponse } from "next/server";
import { isSecureCookie } from "@/lib/auth/cookie-secure";

/** Tema Bootstrap suportado pela aplicação. */
export type AppTheme = "light" | "dark";

export const THEME_COOKIE_NAME = "emp_theme";

/** Valida valor de tema. */
export function isAppTheme(value: unknown): value is AppTheme {
  return value === "light" || value === "dark";
}

/** Opções do cookie de tema (legível pelo script inline no layout). */
export function getThemeCookieOptions(maxAgeSeconds = 365 * 24 * 60 * 60) {
  return {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Define cookie de tema na resposta HTTP. */
export function setThemeCookie(response: NextResponse, theme: AppTheme) {
  response.cookies.set(THEME_COOKIE_NAME, theme, getThemeCookieOptions());
}
