"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { formatNumberPtBr } from "@/lib/format/number";
import { DateTimeStacked } from "@/components/ui/DateTimeStacked";
import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import type { BsodFilterKey } from "@/lib/config/bsod-filters";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import type { PmeBsodRow } from "@/lib/queries/bsod";

type BsodInventoryTableProps = {
  rows: PmeBsodRow[];
  activeFilter?: BsodFilterKey;
};

const TABLE_COLUMNS: SortableColumn[] = [
  { key: "monitor_label", label: "STATUS", sortable: true, align: "center" },
  { key: "ope", label: "OPE", sortable: true, align: "center" },
  { key: "cmts", label: "CMTS", sortable: true, align: "center" },
  { key: "node", label: "NODE", sortable: true, align: "center" },
  { key: "mac", label: "MAC", sortable: true, align: "center" },
  { key: "contrato", label: "CONTRATO", sortable: true, align: "center" },
  { key: "profile", label: "PROFILE", sortable: true, align: "center" },
  { key: "bsod_vlan", label: "VLAN BSOD", sortable: true, align: "center" },
  { key: "tx", label: "TX", sortable: true, align: "center" },
  { key: "rx", label: "RX", sortable: true, align: "center" },
  { key: "mer", label: "MER", sortable: true, align: "center" },
  { key: "monitor_time", label: "ÚLTIMA LEITURA", sortable: true, align: "center" },
];

/** Tabela de inventário PME filtrada por KPI. */
export function BsodInventoryTable({ rows, activeFilter }: BsodInventoryTableProps) {
  return (
    <ContentCard
      title={
        activeFilter
          ? `${METRIC_LABELS.bsod.inventario} — ${filterLabel(activeFilter)} (${rows.length})`
          : `${METRIC_LABELS.bsod.inventario} (${rows.length})`
      }
    >
      <SortableDataTable
        className="sortable-data-table--bsod"
        columns={TABLE_COLUMNS}
        rows={rows as Record<string, unknown>[]}
        empty="Nenhum PME para o filtro selecionado."
        renderCell={renderBsodCell}
      />
    </ContentCard>
  );
}

function filterLabel(key: BsodFilterKey): string {
  const labels: Record<BsodFilterKey, string> = {
    online: METRIC_LABELS.bsod.online,
    offline: METRIC_LABELS.bsod.offline,
    sem_leitura: METRIC_LABELS.bsod.semLeitura,
    com_vlan: METRIC_LABELS.bsod.comVlan,
    sem_vlan: METRIC_LABELS.bsod.semVlan,
  };
  return labels[key];
}

function renderBsodCell(key: string, value: unknown, row: Record<string, unknown>) {
  if (key === "monitor_label") {
    return <HealthBadge label={String(value)} status={row.monitor_status as number | null} />;
  }
  if (key === "monitor_time") {
    return <DateTimeStacked value={value as string | null} />;
  }
  if (key === "profile") {
    if (value == null || value === "") return "—";
    return <span className="bsod-profile-text">{String(value)}</span>;
  }
  if (key === "bsod_vlan") {
    if (value == null || value === "") return "—";
    return <span className="bsod-vlan-badge">{String(value)}</span>;
  }
  if (key === "tx" || key === "rx" || key === "mer") {
    return (
      <SignalMetric kind={key} value={value} monitorStatus={row.monitor_status as number | null} />
    );
  }
  if (value == null || value === "") return "—";
  return String(value);
}

function isSignalNegative(kind: "tx" | "rx" | "mer", value: number): boolean {
  if (Number.isNaN(value)) return false;
  if (kind === "mer") return value <= 36;
  if (kind === "rx") return value < -12;
  return value > 50;
}

function SignalMetric({
  kind,
  value,
  monitorStatus,
}: {
  kind: "tx" | "rx" | "mer";
  value: unknown;
  monitorStatus?: number | null;
}) {
  const isOffline = monitorStatus === 0;

  if (value == null || value === "") {
    return (
      <span
        className={`bsod-signal-metric ${isOffline ? "bsod-signal-metric--negative" : "bsod-signal-metric--empty"}`}
      >
        —
      </span>
    );
  }
  const numeric = Number(value);
  const formatted = formatNumberPtBr(numeric, { maximumFractionDigits: 2 });
  const negative = isOffline || isSignalNegative(kind, numeric);
  return (
    <span
      className={`bsod-signal-metric ${negative ? "bsod-signal-metric--negative" : "bsod-signal-metric--positive"}`}
    >
      {formatted}
    </span>
  );
}

function HealthBadge({ label, status }: { label: string; status: number | null }) {
  let className = "badge rounded-pill bsod-health-badge bsod-health-badge--unknown";
  if (status === 1) className = "badge rounded-pill bsod-health-badge bsod-health-badge--online";
  if (status === 0) className = "badge rounded-pill bsod-health-badge bsod-health-badge--offline";
  return <span className={className}>{label}</span>;
}
