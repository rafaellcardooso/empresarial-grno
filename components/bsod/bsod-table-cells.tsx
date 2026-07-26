import { formatNumberPtBr } from "@/lib/format/number";

/** Badge de saúde do monitor PME (online, offline ou sem leitura). */
export function BsodHealthBadge({ label, status }: { label: string; status: number | null }) {
  let className = "badge rounded-pill bsod-health-badge bsod-health-badge--unknown";
  if (status === 1) className = "badge rounded-pill bsod-health-badge bsod-health-badge--online";
  if (status === 0) className = "badge rounded-pill bsod-health-badge bsod-health-badge--offline";
  return <span className={className}>{label}</span>;
}

function isSignalNegative(kind: "tx" | "rx" | "mer", value: number): boolean {
  if (Number.isNaN(value)) return false;
  if (kind === "mer") return value <= 36;
  if (kind === "rx") return value < -12;
  return value > 50;
}

/** Métrica TX/RX/MER com cor conforme limiar operacional. */
export function BsodSignalMetric({
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
