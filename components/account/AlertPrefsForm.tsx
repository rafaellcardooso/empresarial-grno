"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertUfsPicker } from "@/components/account/AlertUfsPicker";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { apiFetch } from "@/lib/config/base-path";
import type { UserRegionUf } from "@/lib/config/user-regions";

type AlertPrefsFormProps = {
  initialAlertUfs: UserRegionUf[];
  idPrefix?: string;
};

/** Formulário para editar estados dos alertas (conta / configurações). */
export function AlertPrefsForm({
  initialAlertUfs,
  idPrefix = "account-alert",
}: AlertPrefsFormProps) {
  const router = useRouter();
  const [alertUfs, setAlertUfs] = useState<UserRegionUf[]>(initialAlertUfs);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Persiste a seleção de UFs dos alertas. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (alertUfs.length === 0) {
      setError(AUTH_COPY.alertUfsRequired);
      return;
    }
    setLoading(true);

    try {
      const response = await apiFetch("/api/account/alert-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertUfs }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        alertUfs?: UserRegionUf[];
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      if (data.alertUfs) setAlertUfs(data.alertUfs);
      setSuccess(data.message ?? AUTH_COPY.settingsAlertsSuccess);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <AlertUfsPicker
        idPrefix={idPrefix}
        value={alertUfs}
        onChange={setAlertUfs}
        disabled={loading}
      />

      <LoadingButton
        type="submit"
        className="btn btn-primary mt-3"
        loading={loading}
        loadingLabel="Salvando…"
      >
        {AUTH_COPY.settingsAlertsSave}
      </LoadingButton>
    </form>
  );
}
