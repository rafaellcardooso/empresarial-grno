"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BsodDetalhesPanel } from "@/components/bsod/BsodDetalhesPanel";
import { BsodHealthBadge } from "@/components/bsod/bsod-table-cells";
import { TratativaPanel } from "@/components/tratativa/TratativaPanel";
import { TratativaBsodStatusCell } from "@/components/tratativa/TratativaBsodCell";
import { TratativaTreatButton } from "@/components/tratativa/TratativaTreatButton";
import { formatDateTimeDisplay } from "@/components/ui/DateTimeStacked";
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

/** Tabela BSOD prioritária com painel unificado de tratativa. */
export function BsodRecordsTable({
  rows,
  tratativasByKey = {},
  empty = "Nenhum PME para o filtro selecionado.",
  variant = "inventory",
}: BsodRecordsTableProps) {
  const router = useRouter();
  const [selectedRow, setSelectedRow] = useState<PmeBsodRow | null>(null);
  const [treatKey, setTreatKey] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedRow) return;
    const next = rows.find((row) => row.mac === selectedRow.mac);
    if (next && next !== selectedRow) {
      setSelectedRow(next);
    }
  }, [rows, selectedRow]);

  const handlePanelChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  /** Atualiza a linha selecionada após edição manual e recarrega a listagem. */
  const handleInventorySaved = useCallback(
    (row: PmeBsodRow) => {
      setSelectedRow(row);
      router.refresh();
    },
    [router],
  );
  useEffect(() => {
    if (!selectedRow && !treatKey) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRow(null);
        setTreatKey(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedRow, treatKey]);

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
          renderBsodCell(key, value, row, setSelectedRow, tratativas, setTreatKey)
        }
      />
      <BsodDetalhesPanel
        open={selectedRow != null}
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onSaved={handleInventorySaved}
      />{" "}
      <TratativaPanel
        open={treatKey != null}
        domain="BSOD"
        recordKey={treatKey}
        onClose={() => setTreatKey(null)}
        onChanged={handlePanelChanged}
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
  onTreat: (recordKey: string) => void,
) {
  const mac = String(row.mac ?? "");
  const normalized = normalizeTratativaKey("BSOD", mac);
  const tratativa = tratativas[normalized] ?? null;
  const monitorStatus = row.monitor_status;
  const isOffline = monitorStatus === 0 || monitorStatus === "0";

  if (key === "tratativa_status") {
    return <TratativaBsodStatusCell tratativa={tratativa} />;
  }
  if (key === "tratativa_actions" || key === "tratativa") {
    if (!tratativa && !isOffline) return "—";
    return <TratativaTreatButton onClick={() => onTreat(mac)} />;
  }
  if (key === "monitor_label") {
    return <BsodHealthBadge label={String(value)} status={row.monitor_status as number | null} />;
  }
  if (key === "monitor_time") {
    return formatDateTimeDisplay(value as string | null);
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
