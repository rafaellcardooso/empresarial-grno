/** Campos usados na comparação de identidade/métricas entre amostras TX. */
export const TX_HISTORY_COMPARE_FIELDS = [
  "ufs",
  "node_a",
  "port_a",
  "node_b",
  "port_b",
  "txpower_a",
  "rxpower_b",
  "span_loss_a_to_b",
  "ref_span_loss_a_to_b",
  "dif_ref_span_loss_a_to_b",
  "txpower_b",
  "rxpower_a",
  "span_loss_b_to_a",
  "ref_span_loss_b_to_a",
  "dif_ref_span_loss_b_to_a",
];

/** Normaliza valor numérico/string para comparação null-safe. */
export function normalizeComparableValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && String(value).trim() !== "") {
    return asNumber;
  }
  return String(value);
}

/** Retorna true quando identidade e métricas ópticas são iguais. */
export function txMetricsEqual(current, previous) {
  if (!current || !previous) return false;
  for (const field of TX_HISTORY_COMPARE_FIELDS) {
    if (normalizeComparableValue(current[field]) !== normalizeComparableValue(previous[field])) {
      return false;
    }
  }
  return true;
}

/**
 * Decide se grava amostra e com qual reason.
 * @returns {'first'|'change'|'heartbeat'|null}
 */
export function decideTxSampleReason(current, previous, nowMs, heartbeatMs) {
  if (!previous) return "first";
  if (!txMetricsEqual(current, previous)) return "change";
  const sampledAt =
    previous.sampled_at instanceof Date
      ? previous.sampled_at.getTime()
      : Date.parse(String(previous.sampled_at));
  if (!Number.isFinite(sampledAt)) return "heartbeat";
  if (nowMs - sampledAt >= heartbeatMs) return "heartbeat";
  return null;
}

/** Lê retenção em dias (default 90). */
export function parseRetentionDays(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return 90;
  return Math.floor(value);
}

/** Lê intervalo de heartbeat em horas (default 6). */
export function parseHeartbeatHours(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return 6;
  return Math.floor(value);
}
