import { formatNumberPtBr } from "@/lib/format/number";

type BsodCompactTextCellProps = {
  value: unknown;
  variant?: "cliente" | "razao-social" | "default";
};

/** Exibe texto compacto na tabela BSOD com tooltip nativo no hover. */
export function BsodCompactTextCell({ value, variant = "default" }: BsodCompactTextCellProps) {
  if (value == null || value === "") return "—";

  const text = String(value).trim();
  if (!text) return "—";

  return (
    <span className={`bsod-table-text-cell bsod-table-text-cell--${variant}`} title={text}>
      {text}
    </span>
  );
}

/** Badge de saúde do monitor PME (online, offline ou sem leitura). */
export function BsodHealthBadge({ label, status }: { label: string; status: number | null }) {
  let className = "badge rounded-pill bsod-health-badge bsod-health-badge--unknown";
  if (status === 1) className = "badge rounded-pill bsod-health-badge bsod-health-badge--online";
  if (status === 0) className = "badge rounded-pill bsod-health-badge bsod-health-badge--offline";
  return <span className={className}>{label}</span>;
}

/** Normaliza VLAN/CVLAN para comparação estável (remove zeros à esquerda). */
export function normalizeBsodVlanKey(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "";
  const text = String(raw).trim();
  if (!text || text === "-" || text.toLowerCase() === "null") return "";
  const numeric = Number(text.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return String(Math.trunc(numeric));
}

type VlanCompareTone = "match" | "mismatch" | "neutral";

/** Compara VLAN CMTS (SNMP) com CVLAN CRM para destacar acordo/divergência. */
export function bsodVlanCompareTone(
  cmtsVlan: number | null | undefined,
  crmCvlan: string | null | undefined,
): VlanCompareTone {
  const cmts = normalizeBsodVlanKey(cmtsVlan);
  const crm = normalizeBsodVlanKey(crmCvlan);
  if (!cmts || !crm) return "neutral";
  return cmts === crm ? "match" : "mismatch";
}

/** Monta badges VLAN CMTS + CVLAN CRM com verde (iguais) ou amarelo (divergem). */
export function buildBsodVlanCompareBadges({
  cmtsVlan,
  crmCvlan,
}: {
  cmtsVlan: number | null | undefined;
  crmCvlan: string | null | undefined;
}) {
  const tone = bsodVlanCompareTone(cmtsVlan, crmCvlan);
  const cmtsKey = normalizeBsodVlanKey(cmtsVlan);
  const crmKey = normalizeBsodVlanKey(crmCvlan);
  const cmtsClass =
    tone === "match"
      ? "bsod-vlan-badge bsod-vlan-badge--match"
      : tone === "mismatch"
        ? "bsod-vlan-badge bsod-vlan-badge--mismatch"
        : "bsod-vlan-badge";
  const crmClass =
    tone === "match"
      ? "bsod-vlan-badge bsod-vlan-badge--match"
      : tone === "mismatch"
        ? "bsod-vlan-badge bsod-vlan-badge--mismatch-crm"
        : "bsod-vlan-badge bsod-vlan-badge--crm";

  return {
    cmts: cmtsKey ? (
      <span className={cmtsClass} title={tone === "mismatch" ? "Diverge da CVLAN CRM" : undefined}>
        {cmtsKey}
      </span>
    ) : (
      "—"
    ),
    crm: crmKey ? (
      <span className={crmClass} title={tone === "mismatch" ? "Diverge da VLAN CMTS" : undefined}>
        {crmKey}
      </span>
    ) : (
      "—"
    ),
    tone,
  };
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
