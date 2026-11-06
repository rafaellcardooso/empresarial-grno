"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertUfsPicker } from "@/components/account/AlertUfsPicker";
import { HomeUfSelect } from "@/components/account/HomeUfSelect";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { apiFetch } from "@/lib/config/base-path";
import type { UserRegionUf } from "@/lib/config/user-regions";

type RegionSetupModalProps = {
  initialHomeUf: UserRegionUf | null;
  initialAlertUfs: UserRegionUf[];
  onCompleted: (homeUf: UserRegionUf, alertUfs: UserRegionUf[]) => void;
};

/** Modal bloqueante para completar lotação e preferência de alertas. */
export function RegionSetupModal({
  initialHomeUf,
  initialAlertUfs,
  onCompleted,
}: RegionSetupModalProps) {
  const router = useRouter();
  const [homeUf, setHomeUf] = useState<UserRegionUf | "">(initialHomeUf ?? "");
  const [alertUfs, setAlertUfs] = useState<UserRegionUf[]>(
    initialAlertUfs.length > 0 ? initialAlertUfs : initialHomeUf ? [initialHomeUf] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Grava lotação + alertas e libera o shell. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!homeUf) {
      setError(AUTH_COPY.homeUfRequired);
      return;
    }
    if (alertUfs.length === 0) {
      setError(AUTH_COPY.alertUfsRequired);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/account/region-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeUf, alertUfs }),
      });
      const data = (await response.json()) as {
        error?: string;
        homeUf?: UserRegionUf | null;
        alertUfs?: UserRegionUf[];
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      onCompleted(data.homeUf ?? homeUf, data.alertUfs ?? alertUfs);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="region-setup-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-setup-title"
    >
      <div className="region-setup-modal__backdrop" aria-hidden="true" />
      <div className="region-setup-modal__card">
        <h2 className="region-setup-modal__title" id="region-setup-title">
          {AUTH_COPY.regionSetupTitle}
        </h2>
        <p className="region-setup-modal__lead">{AUTH_COPY.regionSetupLead}</p>

        <form onSubmit={handleSubmit}>
          {error ? (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          ) : null}

          <HomeUfSelect
            id="region-setup-home-uf"
            value={homeUf}
            onChange={(next) => {
              setHomeUf(next);
              if (next && alertUfs.length === 0) setAlertUfs([next]);
            }}
            disabled={loading}
          />

          <AlertUfsPicker
            idPrefix="region-setup-alert"
            value={alertUfs}
            onChange={setAlertUfs}
            disabled={loading}
          />

          <div className="region-setup-modal__footer">
            <LoadingButton
              type="submit"
              className="btn btn-primary"
              loading={loading}
              loadingLabel="Salvando…"
            >
              {AUTH_COPY.regionSetupSubmit}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
