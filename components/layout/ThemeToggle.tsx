"use client";

import { useEffect, useState } from "react";

/** Alterna tema claro/escuro Bootstrap e persiste preferência em localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as "light" | "dark" | null) || "light";
    setTheme(stored);
    document.documentElement.setAttribute("data-bs-theme", stored);
  }, []);

  /** Aplica o tema oposto ao atual em DOM e localStorage. */
  function handleThemeToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-bs-theme", nextTheme);
  }

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
        className={`bi ${theme === "light" ? "bi-moon-fill" : "bi-sun-fill"}`}
        style={{ fontSize: "1.2rem" }}
        aria-hidden="true"
      />
    </button>
  );
}
