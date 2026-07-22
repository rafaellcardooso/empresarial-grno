"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { applyClientTheme } from "@/lib/auth/theme-client";
import type { AppTheme } from "@/lib/auth/theme";

/** Alterna tema claro/escuro e persiste no perfil do usuário. */
export function ThemeToggle() {
  const { theme, setTheme } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyClientTheme(theme);
    setMounted(true);
  }, [theme]);

  /** Aplica o tema oposto e salva no perfil. */
  function handleThemeToggle() {
    const nextTheme: AppTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  }

  const iconClass = !mounted || theme === "light" ? "bi-moon-fill" : "bi-sun-fill";

  return (
    <button
      className="btn btn-link nav-link text-white"
      id="theme-toggle-btn"
      type="button"
      onClick={handleThemeToggle}
      title="Alternar tema"
      aria-label="Alternar tema claro ou escuro"
    >
      <i
        className={`bi ${iconClass}`}
        style={{ fontSize: "1.2rem" }}
        aria-hidden="true"
      />
    </button>
  );
}
