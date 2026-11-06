import type { TxDifRefTone } from "@/lib/format/tx-optical";

/** Dimensão do drill-down do relatório TX. */
export type TxReportAtivosDim = "uf" | "empresa" | "dif";

/** Linha compacta da tabela de fatia do relatório TX. */
export type TxReportAtivoRow = {
  designacao: string;
  rota: string;
  ufs: string;
  empresa: string | null;
  node_a: string;
  port_a: string;
  node_b: string;
  port_b: string;
  dif_ref_span_loss_a_to_b: number | string | null;
  dif_ref_span_loss_b_to_a: number | string | null;
  dif_tone: TxDifRefTone;
};
