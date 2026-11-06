import type { TxDifRefTone } from "@/lib/format/tx-optical";

/** Item de ranking do relatório TX. */
export type TxReportRankItem = {
  id: string;
  label: string;
  count: number;
};

/** Resumo analítico dos enlaces ópticos ativos na região. */
export type TxReportSummary = {
  activeCount: number;
  lastSeenAt: string | null;
  byUf: TxReportRankItem[];
  byEmpresa: TxReportRankItem[];
  byDifTone: Array<TxReportRankItem & { tone: TxDifRefTone }>;
};
