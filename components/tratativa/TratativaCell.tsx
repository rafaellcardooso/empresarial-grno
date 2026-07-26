"use client";

import { TratativaBsodCell } from "@/components/tratativa/TratativaBsodCell";
import { TratativaSirCell } from "@/components/tratativa/TratativaSirCell";
import type { TratativaPublic, TratativaRecordKind } from "@/lib/models/tratativa";

type TratativaCellProps = {
  recordKind: TratativaRecordKind;
  recordKey: string;
  tratativa?: TratativaPublic | null;
  variant?: "default" | "compact";
  onChange: (next: TratativaPublic | null) => void;
};

/** Célula de ação para assumir, acionar, validar e concluir tratativa. */
export function TratativaCell({
  recordKind,
  recordKey,
  tratativa,
  variant = "default",
  onChange,
}: TratativaCellProps) {
  if (recordKind === "BSOD") {
    return <TratativaBsodCell recordKey={recordKey} tratativa={tratativa} onChange={onChange} />;
  }

  return (
    <TratativaSirCell
      recordKind={recordKind}
      recordKey={recordKey}
      tratativa={tratativa}
      variant={variant}
      onChange={onChange}
    />
  );
}
