import mysql from "mysql2/promise";

/** Lê env obrigatória. */
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

/** Abre conexão MySQL SIR a partir de SIR_DB_*. */
export async function openSirConnection() {
  const socketPath = process.env.SIR_DB_SOCKET?.trim();
  const base = {
    user: required("SIR_DB_USER"),
    password: required("SIR_DB_PASSWORD"),
    database: process.env.SIR_DB_NAME || "claroEmpresarial",
  };
  if (socketPath) {
    return mysql.createConnection({ ...base, socketPath });
  }
  return mysql.createConnection({
    ...base,
    host: required("SIR_DB_HOST"),
    port: Number(process.env.SIR_DB_PORT || 3306),
  });
}

const UPSERT_SQL = `
INSERT INTO tx_optical_spans (
  designacao, ufs, node_a, port_a, node_b, port_b,
  txpower_a, rxpower_b, span_loss_a_to_b, ref_span_loss_a_to_b, dif_ref_span_loss_a_to_b,
  txpower_b, rxpower_a, span_loss_b_to_a, ref_span_loss_b_to_a, dif_ref_span_loss_b_to_a,
  is_active, first_seen_at, last_seen_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  ufs = VALUES(ufs),
  node_a = VALUES(node_a),
  port_a = VALUES(port_a),
  node_b = VALUES(node_b),
  port_b = VALUES(port_b),
  txpower_a = VALUES(txpower_a),
  rxpower_b = VALUES(rxpower_b),
  span_loss_a_to_b = VALUES(span_loss_a_to_b),
  ref_span_loss_a_to_b = VALUES(ref_span_loss_a_to_b),
  dif_ref_span_loss_a_to_b = VALUES(dif_ref_span_loss_a_to_b),
  txpower_b = VALUES(txpower_b),
  rxpower_a = VALUES(rxpower_a),
  span_loss_b_to_a = VALUES(span_loss_b_to_a),
  ref_span_loss_b_to_a = VALUES(ref_span_loss_b_to_a),
  dif_ref_span_loss_b_to_a = VALUES(dif_ref_span_loss_b_to_a),
  is_active = 1,
  last_seen_at = NOW()
`;

/** UPSERT dos spans da região e desativa ausentes do scrape (só UFs do escopo). */
export async function upsertTxSpans(connection, rows, regionUfs) {
  const seen = [];
  for (const row of rows) {
    await connection.execute(UPSERT_SQL, [
      row.designacao,
      row.ufs,
      row.node_a,
      row.port_a,
      row.node_b,
      row.port_b,
      row.txpower_a,
      row.rxpower_b,
      row.span_loss_a_to_b,
      row.ref_span_loss_a_to_b,
      row.dif_ref_span_loss_a_to_b,
      row.txpower_b,
      row.rxpower_a,
      row.span_loss_b_to_a,
      row.ref_span_loss_b_to_a,
      row.dif_ref_span_loss_b_to_a,
    ]);
    seen.push(row.designacao);
  }

  if (seen.length === 0) return { upserted: 0, deactivated: 0 };

  const placeholders = seen.map(() => "?").join(", ");
  const ufParts = regionUfs.map(() => "FIND_IN_SET(?, ufs) > 0");
  const [result] = await connection.execute(
    `UPDATE tx_optical_spans
     SET is_active = 0
     WHERE is_active = 1
       AND designacao NOT IN (${placeholders})
       AND (${ufParts.join(" OR ")})`,
    [...seen, ...regionUfs],
  );

  return {
    upserted: seen.length,
    deactivated: Number(result.affectedRows ?? 0),
  };
}
