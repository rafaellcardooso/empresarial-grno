import type { AppTheme } from "@/lib/auth/theme";

/** Aplica tema no documento e cache local (fallback em telas públicas). */
export function applyClientTheme(theme: AppTheme): void {
  document.documentElement.setAttribute("data-bs-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
}

/** Lê tema do localStorage (telas sem sessão). */
export function readStoredClientTheme(): AppTheme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "light";
}

/** Persiste tema no perfil do usuário logado. */
export async function persistUserTheme(theme: AppTheme): Promise<void> {
  applyClientTheme(theme);
  await fetch("/api/account/theme", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
}

/** Carrega tema preferido do usuário autenticado. */
export async function loadAuthenticatedTheme(): Promise<AppTheme> {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      return readStoredClientTheme();
    }
    const data = (await response.json()) as { theme?: string };
    const theme = data.theme === "dark" ? "dark" : "light";
    applyClientTheme(theme);
    return theme;
  } catch {
    return readStoredClientTheme();
  }
}
