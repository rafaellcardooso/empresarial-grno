"use client";

import { AcionamentoForm } from "@/components/tratativa/AcionamentoForm";
import { UI_COPY } from "@/lib/config/ui-copy";

type PrepRecordKind = "RAL" | "REC" | "SDH";

type SirPrepPanelProps = {
  recordKind: PrepRecordKind;
  recordKey: string;
  disabled?: boolean;
  unlocked?: boolean;
  onRegistered?: () => void;
};

/**
 * Acionamento SIR/SDH com os mesmos campos de técnico do BSOD
 * (agendamento, técnico, sintoma e prévia).
 */
export function SirPrepPanel({
  recordKind,
  recordKey,
  disabled = false,
  unlocked = false,
  onRegistered,
}: SirPrepPanelProps) {
  const isSdh = recordKind === "SDH";
  const hint = isSdh ? UI_COPY.sdhPrepHint : UI_COPY.sirPrepHint;
  const unlockedLabel = isSdh ? UI_COPY.sdhPrepUnlocked : UI_COPY.sirPrepUnlocked;

  return (
    <div className="sir-prep-panel">
      {unlocked ? (
        <div className="alert alert-success py-2 small">{unlockedLabel}</div>
      ) : (
        <p className="small text-body-secondary">{hint}</p>
      )}
      <AcionamentoForm
        recordKind={recordKind}
        recordKey={recordKey}
        disabled={disabled}
        onRegistered={onRegistered}
      />
    </div>
  );
}
