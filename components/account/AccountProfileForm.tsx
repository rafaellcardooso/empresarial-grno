"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { CORPORATE_ID_HINT } from "@/lib/auth/validation";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { apiFetch } from "@/lib/config/base-path";

type AccountProfileFormProps = {
  initialCorporateId: string;
  initialName: string;
  initialEmail: string | null;
};

/** Formulário de edição dos dados cadastrais na Minha conta. */
export function AccountProfileForm({
  initialCorporateId,
  initialName,
  initialEmail,
}: AccountProfileFormProps) {
  const router = useRouter();
  const [corporateId, setCorporateId] = useState(initialCorporateId);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Salva matrícula, nome e e-mail do usuário autenticado. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiFetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporateId,
          name,
          email: email.trim() === "" ? null : email.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar os dados.");
        return;
      }

      setSuccess(data.message ?? AUTH_COPY.profileUpdateSuccess);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error ? (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success py-2" role="status">
          {success}
        </div>
      ) : null}

      <div className="mb-3">
        <label htmlFor="account-corporate-id" className="form-label">
          Login corporativo
        </label>
        <input
          id="account-corporate-id"
          type="text"
          className="form-control text-uppercase"
          autoComplete="username"
          required
          value={corporateId}
          onChange={(event) => setCorporateId(event.target.value.toUpperCase())}
        />
        <div className="form-text">{CORPORATE_ID_HINT}</div>
      </div>

      <div className="mb-3">
        <label htmlFor="account-name" className="form-label">
          Nome
        </label>
        <input
          id="account-name"
          type="text"
          className="form-control"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="account-email" className="form-label">
          E-mail
        </label>
        <input
          id="account-email"
          type="email"
          className="form-control"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="form-text">Opcional.</div>
      </div>

      <LoadingButton
        type="submit"
        className="btn btn-primary"
        loading={loading}
        loadingLabel="Salvando…"
      >
        Salvar dados
      </LoadingButton>
    </form>
  );
}
