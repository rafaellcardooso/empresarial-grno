"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corporateId, name, email: email || undefined, password, confirmPassword }),
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
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="alert alert-success py-2" role="alert">
            {success}
          </div>
        ) : null}

        <div className="mb-3">
          <label htmlFor="register-corporate-id" className="form-label">
            Matrícula corporativa
          </label>
          <input
            id="register-corporate-id"
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
          <label htmlFor="register-name" className="form-label">
            Nome
          </label>
          <input
            id="register-name"
            type="text"
            className="form-control"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="register-email" className="form-label">
            E-mail corporativo <span className="text-body-secondary">(opcional)</span>
          </label>
          <input
            id="register-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="form-text">Usado para recuperação de senha, se configurado.</div>
        </div>

        <div className="mb-3">
          <label htmlFor="register-password" className="form-label">
            Senha
          </label>
          <input
            id="register-password"
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
          <label htmlFor="register-confirm" className="form-label">
            Confirmar senha
          </label>
          <input
            id="register-confirm"
            type="password"
            className="form-control"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        <LoadingButton type="submit" className="btn btn-primary w-100" loading={loading} loadingLabel="Enviando…">
          Solicitar acesso
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
