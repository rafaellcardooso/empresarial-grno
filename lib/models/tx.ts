/** Span óptico TX espelhando `tx_optical_spans` (CSV GRB). */
export type TxOpticalSpan = {
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
  is_active: number;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  updated_at: Date | string;
};

/** Contagem de spans ativos por UF da região. */
export type TxUfCount = {
  uf: string;
  count: number;
};
