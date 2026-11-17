import type { CsvColumn } from "@/lib/export/csv";
import { parseTxDesignacao } from "@/lib/config/tx-optical";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatOpticalValue } from "@/lib/format/tx-optical";
import type { TxOpticalSample, TxOpticalSampleReason } from "@/lib/models/tx";

const REASON_LABEL: Record<TxOpticalSampleReason, string> = {
  first: "Primeira",
  change: "Mudança",
  heartbeat: "Confirmação",
};

export const TX_HISTORY_EXPORT_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  {
    key: "sampled_at",
    label: "SAMPLED_AT",
    format: (value) =>
      formatDateTimePtBr(
        typeof value === "string" ? value : value instanceof Date ? value.toISOString() : null,
      ),
  },
  {
    key: "reason_label",
    label: "MOTIVO",
  },
  { key: "designacao", label: "DESIGNAÇÃO" },
  { key: "rota", label: "ROTA" },
  { key: "extensao_km", label: "KM" },
  { key: "empresa", label: "EMPRESA" },
  { key: "ufs", label: "UF" },
  { key: "node_a", label: "NODE_A" },
  { key: "port_a", label: "PORT_A" },
  { key: "node_b", label: "NODE_B" },
  { key: "port_b", label: "PORT_B" },
  {
    key: "txpower_a",
    label: "TXPOWER_A",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "rxpower_b",
    label: "RXPOWER_B",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "span_loss_a_to_b",
    label: "SPAN_LOSS_A_TO_B",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "ref_span_loss_a_to_b",
    label: "REF_SPAN_LOSS_A_TO_B",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "dif_ref_span_loss_a_to_b",
    label: "DIF_REF_SPAN_LOSS_A_TO_B",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "txpower_b",
    label: "TXPOWER_B",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "rxpower_a",
    label: "RXPOWER_A",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "span_loss_b_to_a",
    label: "SPAN_LOSS_B_TO_A",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "ref_span_loss_b_to_a",
    label: "REF_SPAN_LOSS_B_TO_A",
    format: (value) => formatOpticalValue(value),
  },
  {
    key: "dif_ref_span_loss_b_to_a",
    label: "DIF_REF_SPAN_LOSS_B_TO_A",
    format: (value) => formatOpticalValue(value),
  },
];

/** Rótulo em português do motivo da amostra. */
export function txSampleReasonLabel(reason: string): string {
  if (reason === "first" || reason === "change" || reason === "heartbeat") {
    return REASON_LABEL[reason];
  }
  return reason;
}

/** Enriquece linhas de histórico TX para o serializer CSV. */
export function txHistoryRowsForExport(rows: TxOpticalSample[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const parts = parseTxDesignacao(row.designacao);
    return {
      ...row,
      reason_label: txSampleReasonLabel(row.reason),
      rota: parts.rota,
      extensao_km: parts.extensaoKm,
      empresa: parts.empresa,
    };
  });
}
