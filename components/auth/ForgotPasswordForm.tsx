"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";
import { apiFetch } from "@/lib/config/base-path";

/** Formulário de redefinição de senha (login corporativo + nova senha). */
export function ForgotPasswordForm() {
  const [corporateId, setCorporateId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /** Redefine senha via API pública. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setLoading(true);

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corporateId, password, confirmPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSubmitted(true);
      setFeedback(data.message ?? AUTH_COPY.forgotSuccess);
      setCorporateId("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.forgotTitle}
      description={AUTH_COPY.forgotLead}
      footer={<AuthLink href="/login">Voltar ao login</AuthLink>}
    >
      {submitted && feedback ? (
        <div className="auth-form">
          <div className="auth-alert auth-alert--success" role="status">
            {feedback}
          </div>
          <Link href="/login" className="auth-submit">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          {error ? (
            <div className="auth-alert auth-alert--error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="auth-field">
            <label htmlFor="forgot-corporate-id">Login corporativo</label>
            <input
              id="forgot-corporate-id"
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
            <label htmlFor="forgot-password">Nova senha</label>
            <PasswordInput
              id="forgot-password"
              autoComplete="new-password"
              required
              value={password}
              onChange={setPassword}
            />
            <p className="auth-hint">{PASSWORD_REQUIREMENTS}</p>
          </div>

          <div className="auth-field">
            <label htmlFor="forgot-confirm-password">Confirmar nova senha</label>
            <PasswordInput
              id="forgot-confirm-password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
