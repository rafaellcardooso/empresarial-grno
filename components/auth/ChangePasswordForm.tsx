"use client";

import { useState } from "react";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

type ChangePasswordFormProps = {
  onSuccess?: () => void;
};

/** Formulário de alteração de senha (usuário logado). */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Envia nova senha para API autenticada. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível alterar a senha.");
        return;
      }

      setSuccess(data.message ?? "Senha alterada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
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
        <div className="alert alert-success py-2" role="alert">
          {success}
        </div>
      ) : null}

      <div className="mb-3">
        <label htmlFor="current-password" className="form-label">
          Senha atual
        </label>
        <input
          id="current-password"
          type="password"
          className="form-control"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="new-password" className="form-label">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          className="form-control"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <div className="form-text">{PASSWORD_REQUIREMENTS}</div>
      </div>

      <div className="mb-3">
        <label htmlFor="confirm-new-password" className="form-label">
          Confirmar nova senha
        </label>
        <input
          id="confirm-new-password"
          type="password"
          className="form-control"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Salvando…" : "Alterar senha"}
      </button>
    </form>
  );
}
