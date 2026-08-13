"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";
import { apiFetch } from "@/lib/config/base-path";

/** Formulário de cadastro (conta pendente). */
export function RegisterForm() {
  const router = useRouter();
  const [corporateId, setCorporateId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Envia cadastro para aprovação staff. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporateId,
          name,
          email: email || undefined,
          password,
          confirmPassword,
        }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível cadastrar.");
        return;
      }

      setSuccess(data.message ?? "Cadastro enviado.");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.registerTitle}
      description={AUTH_COPY.registerLead}
      footer={<AuthLink href="/login">Já tenho conta</AuthLink>}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error ? (
          <div className="auth-alert auth-alert--error" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="auth-alert auth-alert--success" role="status">
            {success}
          </div>
        ) : null}

        <div className="auth-field">
          <label htmlFor="register-corporate-id">Login corporativo</label>
          <input
            id="register-corporate-id"
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
          <label htmlFor="register-name">Nome</label>
          <input
            id="register-name"
            type="text"
            className="auth-input"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">
            E-mail corporativo <span className="auth-optional">(opcional)</span>
          </label>
          <input
            id="register-email"
            type="email"
            className="auth-input"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Senha</label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
          />
          <p className="auth-hint">{PASSWORD_REQUIREMENTS}</p>
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm">Confirmar senha</label>
          <PasswordInput
            id="register-confirm"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Enviando…" : "Solicitar acesso"}
        </button>
      </form>
    </AuthShell>
  );
}
