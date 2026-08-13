"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { applyClientTheme } from "@/lib/auth/theme-client";
import type { AppTheme } from "@/lib/auth/theme";
import { CORPORATE_ID_HINT } from "@/lib/auth/validation";
import { appHref, apiFetch } from "@/lib/config/base-path";

const REMEMBER_ME_KEY = "emp_remember_me";

/** Formulário de login por login corporativo. */
export function LoginForm() {
  const searchParams = useSearchParams();
  const [corporateId, setCorporateId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMEMBER_ME_KEY);
      if (stored === "0") {
        setRememberMe(false);
      }
    } catch {
      // ignore
    }
  }, []);

  /** Envia credenciais para API de login. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0");
    } catch {
      // ignore
    }

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ corporateId, password, rememberMe }),
      });
      const data = (await response.json()) as { error?: string; theme?: AppTheme };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      if (data.theme === "light" || data.theme === "dark") {
        applyClientTheme(data.theme);
      }

      const next = searchParams.get("next") || "/";
      window.location.assign(appHref(next));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.loginTitle}
      footer={
        <>
          <AuthLink href="/esqueci-senha">Esqueci a senha</AuthLink>
          <span className="auth-card__footer-sep">·</span>
          <AuthLink href="/cadastro">Criar conta</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error ? (
          <div className="auth-alert auth-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="auth-field">
          <label htmlFor="login-corporate-id">Login corporativo</label>
          <input
            id="login-corporate-id"
            type="text"
            className="auth-input auth-input--upper"
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            required
            value={corporateId}
            onChange={(event) => setCorporateId(event.target.value.toUpperCase())}
          />
          <p className="auth-hint">{CORPORATE_ID_HINT}</p>
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Senha</label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
          />
        </div>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Manter conectado</span>
        </label>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
