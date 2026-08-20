-- Última amostra RF por (ope, mac) para leitura O(1) na UI BSOD.
-- Histórico permanece em bsod_monitor; o worker faz UPSERT aqui a cada INSERT.
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS bsod_monitor_latest (
  ope VARCHAR(100) NOT NULL,
  ddd VARCHAR(10) NOT NULL DEFAULT '',
  mac VARCHAR(100) NOT NULL,
  status INT NOT NULL DEFAULT 0,
  tx DOUBLE NOT NULL DEFAULT 0,
  rx DOUBLE NOT NULL DEFAULT 0,
  mer DOUBLE NOT NULL DEFAULT 0,
  sampled_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ope, mac),
  KEY ix_bsod_monitor_latest_mac (mac),
  KEY ix_bsod_monitor_latest_sampled_at (sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Índice para manutenção/consultas no histórico (GROUP BY mac, sampled_at).
ALTER TABLE bsod_monitor
  ADD KEY ix_bsod_monitor_mac_sampled (mac, sampled_at);

-- Backfill a partir da amostra mais recente por ope+mac.
INSERT INTO bsod_monitor_latest (ope, ddd, mac, status, tx, rx, mer, sampled_at)
SELECT m.ope, m.ddd, m.mac, m.status, m.tx, m.rx, m.mer, m.sampled_at
FROM bsod_monitor m
INNER JOIN (
  SELECT ope, mac, MAX(sampled_at) AS max_time
  FROM bsod_monitor
  GROUP BY ope, mac
) latest
  ON m.ope = latest.ope
 AND m.mac = latest.mac
 AND m.sampled_at = latest.max_time
ON DUPLICATE KEY UPDATE
  ddd = VALUES(ddd),
  status = VALUES(status),
  tx = VALUES(tx),
  rx = VALUES(rx),
  mer = VALUES(mer),
  sampled_at = VALUES(sampled_at);
