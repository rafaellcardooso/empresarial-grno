"use client";

import { useCallback, useEffect, useState } from "react";
import { BsodDetalhesPanel } from "@/components/bsod/BsodDetalhesPanel";
import { BsodHealthBadge } from "@/components/bsod/bsod-table-cells";
import { TratativaCell } from "@/components/tratativa/TratativaCell";
import {
  TratativaBsodActionsCell,
  TratativaBsodStatusCell,
} from "@/components/tratativa/TratativaBsodCell";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import { SortableDataTable } from "@/components/ui/SortableDataTable";
import {
  BSOD_ALARM_TABLE_COLUMNS,
  BSOD_INVENTORY_TABLE_COLUMNS,
  BSOD_NORMALIZED_TABLE_COLUMNS,
} from "@/lib/config/bsod-tables";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { TratativaPublic } from "@/lib/models/tratativa";
import type { PmeBsodRow } from "@/lib/queries/bsod";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

type BsodRecordsTableProps = {
  rows: PmeBsodRow[];
  tratativasByKey?: Record<string, TratativaPublic>;
  empty?: string;
  variant?: "alarms" | "inventory" | "normalized";
};

/** Tabela BSOD compacta com painel lateral para métricas e endereço. */
export function BsodRecordsTable({
  rows,
  tratativasByKey = {},
  empty = "Nenhum PME para o filtro selecionado.",
  variant = "inventory",
}: BsodRecordsTableProps) {
  const [selectedRow, setSelectedRow] = useState<PmeBsodRow | null>(null);
  const [tratativas, setTratativas] = useState(tratativasByKey);
  const columns =
    variant === "alarms"
      ? BSOD_ALARM_TABLE_COLUMNS
      : variant === "normalized"
        ? BSOD_NORMALIZED_TABLE_COLUMNS
        : BSOD_INVENTORY_TABLE_COLUMNS;

  useEffect(() => {
    setTratativas(tratativasByKey);
  }, [tratativasByKey]);

  const handleTratativaChange = useCallback((recordKey: string, next: TratativaPublic | null) => {
    const normalized = normalizeTratativaKey("BSOD", recordKey);
    setTratativas((current) => {
      const updated = { ...current };
      if (next) {
        updated[normalized] = next;
      } else {
        delete updated[normalized];
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!selectedRow) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRow(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedRow]);

  return (
    <>
      <SortableDataTable
        className="sortable-data-table--bsod"
        columns={columns}
        rows={rows as Record<string, unknown>[]}
        empty={empty}
        defaultSort={
          variant === "inventory"
            ? { key: "monitor_status", direction: "asc" }
            : { key: "monitor_time", direction: "desc" }
        }
        sortTieBreakers={
          variant === "inventory"
            ? ["monitor_status", "cmts", "node", "mac"]
            : ["cmts", "node", "mac"]
        }
        renderCell={(key, value, row) =>
          renderBsodCell(key, value, row, setSelectedRow, tratativas, handleTratativaChange)
        }
      />

      <BsodDetalhesPanel
        open={selectedRow != null}
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </>
  );
}

function renderBsodCell(
  key: string,
  value: unknown,
  row: Record<string, unknown>,
  onOpen: (row: PmeBsodRow) => void,
  tratativas: Record<string, TratativaPublic>,
  onTratativaChange: (recordKey: string, next: TratativaPublic | null) => void,
) {
  const mac = String(row.mac ?? "");
  const normalized = normalizeTratativaKey("BSOD", mac);
  const tratativa = tratativas[normalized] ?? null;

  if (key === "tratativa_status") {
    return <TratativaBsodStatusCell tratativa={tratativa} />;
  }
  if (key === "tratativa_actions") {
    return (
      <TratativaBsodActionsCell
        recordKey={mac}
        tratativa={tratativa}
        onChange={(next) => onTratativaChange(mac, next)}
      />
    );
  }
  if (key === "tratativa") {
    return (
      <TratativaCell
        recordKind="BSOD"
        recordKey={mac}
        tratativa={tratativa}
        onChange={(next) => onTratativaChange(mac, next)}
      />
    );
  }
  if (key === "monitor_label") {
    return <BsodHealthBadge label={String(value)} status={row.monitor_status as number | null} />;
  }
  if (key === "monitor_time") {
    return <DateTimeStacked value={value as string | null} />;
  }
  if (key === "detalhes") {
    return (
      <button
        type="button"
        className="sir-detalhes-btn"
        onClick={() => onOpen(row as PmeBsodRow)}
        aria-label={`${UI_COPY.sirViewDetails} ${mac}`}
        title={UI_COPY.sirViewDetails}
      >
        <i className="bi bi-eye" aria-hidden="true" />
      </button>
    );
  }
  if (value == null || value === "") return "—";
  return String(value);
}
