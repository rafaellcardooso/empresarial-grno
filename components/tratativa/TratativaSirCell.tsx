"use client";

import { useCallback, useState } from "react";
import { AcionamentoModal } from "@/components/tratativa/AcionamentoModal";
import { useSession } from "@/components/layout/SessionProvider";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type TratativaSirCellProps = {
  recordKind: "RAL" | "REC";
  recordKey: string;
  tratativa?: TratativaPublic | null;
  variant?: "default" | "compact";
  onChange: (next: TratativaPublic | null) => void;
};

/** Célula de tratativa SIR com assumir, acionar VT e liberar. */
export function TratativaSirCell({
  recordKind,
  recordKey,
  tratativa,
  variant = "default",
  onChange,
}: TratativaSirCellProps) {
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acionamentoOpen, setAcionamentoOpen] = useState(false);

  const normalizedKey = normalizeTratativaKey(recordKind, recordKey);
  const isMine = tratativa?.userId === user.id;
  const canManage = isMine || user.role === "STAFF";
  const canRelease = canManage;

  const handleAssume = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tratativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind, recordKey: normalizedKey }),
      });
      const payload = (await response.json()) as {
        tratativa?: TratativaPublic;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 409 && payload.tratativa) {
          onChange(payload.tratativa);
        }
        setError(payload.error ?? UI_COPY.tratativaAssumeError);
        return;
      }

      if (payload.tratativa) {
        onChange(payload.tratativa);
      }
    } catch {
      setError(UI_COPY.tratativaAssumeError);
    } finally {
      setBusy(false);
    }
  }, [normalizedKey, onChange, recordKind]);

  const handleRelease = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tratativas/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordKind, recordKey: normalizedKey }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? UI_COPY.tratativaReleaseError);
        return;
      }

      onChange(null);
    } catch {
      setError(UI_COPY.tratativaReleaseError);
    } finally {
      setBusy(false);
    }
  }, [normalizedKey, onChange, recordKind]);

  if (!normalizedKey) return "—";

  const cellClass =
    variant === "compact" ? "tratativa-cell tratativa-cell--compact" : "tratativa-cell";
  const assumeClass =
    variant === "compact"
      ? "tratativa-assume-btn tratativa-assume-btn--compact"
      : "tratativa-assume-btn";
  const acionarClass =
    variant === "compact"
      ? "tratativa-acionar-btn tratativa-acionar-btn--compact"
      : "tratativa-acionar-btn";

  if (!tratativa) {
    return (
      <div className={cellClass}>
        <button
          type="button"
          className={assumeClass}
          onClick={handleAssume}
          disabled={busy}
          title={UI_COPY.tratativaAssume}
          aria-label={UI_COPY.tratativaAssume}
        >
          <i className="bi bi-person-check" aria-hidden="true" />
          {variant === "compact" ? null : (
            <span>{busy ? UI_COPY.tratativaBusy : UI_COPY.tratativaAssume}</span>
          )}
        </button>
        {error ? <span className="tratativa-cell__error">{error}</span> : null}
      </div>
    );
  }

  const badgeTitle = `${tratativa.userName} (${tratativa.userCorporateId}) — ${UI_COPY.tratativaSince} ${tratativa.startedAt}`;

  return (
    <>
      <div className={cellClass}>
        <div
          className={`tratativa-badge ${isMine ? "tratativa-badge--mine" : "tratativa-badge--other"}${variant === "compact" ? " tratativa-badge--compact" : ""}`}
          title={badgeTitle}
        >
          <span className="tratativa-badge__name">{tratativa.userName}</span>
          {variant === "compact" ? null : (
            <>
              <span className="tratativa-badge__meta">{tratativa.userCorporateId}</span>
              <DateTimeStacked value={tratativa.startedAt} />
            </>
          )}
        </div>

        {canManage ? (
          <button
            type="button"
            className={acionarClass}
            onClick={() => setAcionamentoOpen(true)}
            disabled={busy}
            title={UI_COPY.acionamentoOpen}
            aria-label={UI_COPY.acionamentoOpen}
          >
            <i className="bi bi-whatsapp" aria-hidden="true" />
            {variant === "compact" ? null : <span>{UI_COPY.acionamentoOpen}</span>}
          </button>
        ) : null}

        {canRelease ? (
          <button
            type="button"
            className={`tratativa-release-btn${variant === "compact" ? " tratativa-release-btn--compact" : ""}`}
            onClick={handleRelease}
            disabled={busy}
            title={UI_COPY.tratativaRelease}
            aria-label={UI_COPY.tratativaRelease}
          >
            {variant === "compact" ? (
              <i className="bi bi-x-circle" aria-hidden="true" />
            ) : busy ? (
              UI_COPY.tratativaBusy
            ) : (
              UI_COPY.tratativaRelease
            )}
          </button>
        ) : null}

        {error ? <span className="tratativa-cell__error">{error}</span> : null}
      </div>

      <AcionamentoModal
        open={acionamentoOpen}
        recordKind={recordKind}
        recordKey={normalizedKey}
        onClose={() => setAcionamentoOpen(false)}
      />
    </>
  );
}
