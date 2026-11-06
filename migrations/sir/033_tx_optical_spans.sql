-- Potência óptica TX (CSV GRB relatorio_potencia_optica_tx)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS tx_optical_spans (
  designacao VARCHAR(512) NOT NULL,
  ufs VARCHAR(32) NOT NULL,
  node_a VARCHAR(128) NOT NULL,
  port_a VARCHAR(128) NOT NULL,
  node_b VARCHAR(128) NOT NULL,
  port_b VARCHAR(128) NOT NULL,
  txpower_a DECIMAL(8, 2) DEFAULT NULL,
  rxpower_b DECIMAL(8, 2) DEFAULT NULL,
  span_loss_a_to_b DECIMAL(8, 2) DEFAULT NULL,
  ref_span_loss_a_to_b DECIMAL(8, 2) DEFAULT NULL,
  dif_ref_span_loss_a_to_b DECIMAL(8, 2) DEFAULT NULL,
  txpower_b DECIMAL(8, 2) DEFAULT NULL,
  rxpower_a DECIMAL(8, 2) DEFAULT NULL,
  span_loss_b_to_a DECIMAL(8, 2) DEFAULT NULL,
  ref_span_loss_b_to_a DECIMAL(8, 2) DEFAULT NULL,
  dif_ref_span_loss_b_to_a DECIMAL(8, 2) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (designacao),
  KEY idx_tx_optical_spans_active_ufs (is_active, ufs),
  KEY idx_tx_optical_spans_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
