/** Motivo da amostra no histórico TX. */
export type TxOpticalSampleReason = "first" | "change" | "heartbeat";

/** Campos ópticos compartilhados entre span atual e amostra histórica. */
export type TxOpticalMetrics = {
  designacao: string;
  ufs: string;
  node_a: string;
  port_a: string;
  node_b: string;
  port_b: string;
  txpower_a: number | string | null;
  rxpower_b: number | string | null;
  span_loss_a_to_b: number | string | null;
  ref_span_loss_a_to_b: number | string | null;
  dif_ref_span_loss_a_to_b: number | string | null;
  txpower_b: number | string | null;
  rxpower_a: number | string | null;
  span_loss_b_to_a: number | string | null;
  ref_span_loss_b_to_a: number | string | null;
  dif_ref_span_loss_b_to_a: number | string | null;
};

/** Span óptico TX espelhando `tx_optical_spans` (CSV GRB). */
export type TxOpticalSpan = TxOpticalMetrics & {
  is_active: number;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  updated_at: Date | string;
};

/** Amostra histórica espelhando `tx_optical_samples`. */
export type TxOpticalSample = TxOpticalMetrics & {
  id: number;
  sampled_at: Date | string;
  reason: TxOpticalSampleReason;
};

/** Contagem de spans ativos por UF da região. */
export type TxUfCount = {
  uf: string;
  count: number;
};
