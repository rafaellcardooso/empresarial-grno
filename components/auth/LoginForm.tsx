"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { applyClientTheme } from "@/lib/auth/theme-client";
import type { AppTheme } from "@/lib/auth/theme";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT } from "@/lib/auth/validation";

const REMEMBER_ME_KEY = "emp_remember_me";

/** Formulário de login. */
export function LoginForm() {
  const router = useRouter();
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      router.push(next);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.loginTitle}
      description={AUTH_COPY.loginLead}
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
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mb-3">
          <label htmlFor="login-corporate-id" className="form-label">
            Matrícula corporativa
          </label>
          <input
            id="login-corporate-id"
            type="text"
            className="form-control text-uppercase"
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            required
            value={corporateId}
            onChange={(event) => setCorporateId(event.target.value.toUpperCase())}
          />
          <div className="form-text">{CORPORATE_ID_HINT}</div>
        </div>

        <div className="mb-3">
          <label htmlFor="login-password" className="form-label">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="form-check mb-3">
          <input
            id="login-remember-me"
            type="checkbox"
            className="form-check-input"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <label htmlFor="login-remember-me" className="form-check-label">
            Manter conectado
          </label>
        </div>

        <LoadingButton
          type="submit"
          className="btn btn-primary w-100"
          loading={loading}
          loadingLabel="Entrando…"
        >
          Entrar
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
