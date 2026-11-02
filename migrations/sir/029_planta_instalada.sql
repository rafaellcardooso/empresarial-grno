-- Espelho diário de db_planta.planta_instalada (MySQL Terminal).
-- Populada por workers/planta (DELETE + INSERT em transação única a cada ciclo).
-- designacao_circuito sem UNIQUE: unicidade na origem não garantida.
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS tbl_planta_instalada (
  id BIGINT NOT NULL AUTO_INCREMENT,
  designacao_circuito VARCHAR(255) DEFAULT NULL,
  razao_social VARCHAR(255) DEFAULT NULL,
  num_pta VARCHAR(64) DEFAULT NULL,
  cep_pta VARCHAR(16) DEFAULT NULL,
  velocidade VARCHAR(64) DEFAULT NULL,
  risco_multa VARCHAR(64) DEFAULT NULL,
  estacao_entrega_acesso VARCHAR(255) DEFAULT NULL,
  descr_acesso_ponta TEXT DEFAULT NULL,
  synced_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_planta_designacao (designacao_circuito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
