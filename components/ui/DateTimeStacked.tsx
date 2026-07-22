"use client";

import type { ReactNode } from "react";
import { formatDateTimeParts, formatDateTimePtBr } from "@/lib/format/datetime";

/** Data/hora em duas linhas — cabe em colunas estreitas sem scroll. */
export function DateTimeStacked({ value }: { value: string | null | undefined }) {
  const parts = formatDateTimeParts(value);
  if (!parts) return <>—</>;

  return (
    <span className="datetime-stacked" suppressHydrationWarning>
      <span className="datetime-stacked__date" suppressHydrationWarning>
        {parts.date}
      </span>
      <span className="datetime-stacked__time" suppressHydrationWarning>
        {parts.time}
      </span>
    </span>
  );
}

/** Texto datetime inline (fallback). */
export function formatDateTimeDisplay(value: string | null | undefined): ReactNode {
  return formatDateTimePtBr(value);
}
