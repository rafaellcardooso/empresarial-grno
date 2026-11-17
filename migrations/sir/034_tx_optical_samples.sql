-- Histórico consultável de potência óptica TX (amostras em mudança / heartbeat)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS tx_optical_samples (
  id BIGINT NOT NULL AUTO_INCREMENT,
  designacao VARCHAR(512) NOT NULL,
  sampled_at DATETIME NOT NULL,
  reason ENUM('first', 'change', 'heartbeat') NOT NULL,
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
  PRIMARY KEY (id),
  KEY idx_tx_optical_samples_designacao_sampled (designacao, sampled_at),
  KEY idx_tx_optical_samples_sampled (sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
