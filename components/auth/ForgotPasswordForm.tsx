"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

/** Formulário de redefinição de senha (matrícula + nova senha). */
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
      const response = await fetch("/api/auth/forgot-password", {
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
          <div className="alert alert-success py-2 mb-3" role="status">
            {feedback}
          </div>
          <Link href="/login" className="btn btn-primary w-100">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          {error ? (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor="forgot-corporate-id" className="form-label">
              Matrícula corporativa
            </label>
            <input
              id="forgot-corporate-id"
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
            <label htmlFor="forgot-password" className="form-label">
              Nova senha
            </label>
            <input
              id="forgot-password"
              type="password"
              className="form-control"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="form-text">{PASSWORD_REQUIREMENTS}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="forgot-confirm-password" className="form-label">
              Confirmar nova senha
            </label>
            <input
              id="forgot-confirm-password"
              type="password"
              className="form-control"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
