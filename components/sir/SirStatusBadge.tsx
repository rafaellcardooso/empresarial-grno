import { SIR_RECORD_STATUS, type SirRecordStatus } from "@/lib/models/sir";

type SirStatusBadgeProps = {
  value: SirRecordStatus | string | null | undefined;
};

const STATUS_CLASS: Record<SirRecordStatus, string> = {
  ATIVO: "text-bg-success",
  ENCERRADO: "text-bg-secondary",
};

/** Badge de status ATIVO/ENCERRADO para registros SIR. */
export function SirStatusBadge({ value }: SirStatusBadgeProps) {
  const status = String(value ?? "").toUpperCase();
  if (status !== SIR_RECORD_STATUS.active && status !== SIR_RECORD_STATUS.closed) {
    return <>—</>;
  }

  return (
    <span className={`badge ${STATUS_CLASS[status as SirRecordStatus]}`}>
      {status === SIR_RECORD_STATUS.active ? "ATIVO" : "ENCERRADO"}
    </span>
  );
}
