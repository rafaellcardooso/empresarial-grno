-- SIR schema: rals + recs (aligned with production dump backup_sir_16052026.sql)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS rals (
  id INT NOT NULL AUTO_INCREMENT,
  num_recup VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  tipo_ral VARCHAR(50) NOT NULL,
  codigo_anormalidade VARCHAR(50) NOT NULL,
  abertura VARCHAR(50) NOT NULL,
  duracao VARCHAR(50) NOT NULL,
  cf_executante VARCHAR(50) NOT NULL,
  ultima_atualizacao DATETIME NOT NULL,
  detalhes TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (id),
  UNIQUE KEY unique_num_recup (num_recup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_rals_status_updated ON rals (status, ultima_atualizacao DESC);
CREATE INDEX idx_rals_cf_executante ON rals (cf_executante);

CREATE TABLE IF NOT EXISTS recs (
  num_recup VARCHAR(50) NOT NULL,
  prioridade VARCHAR(50) DEFAULT NULL,
  pontos VARCHAR(50) DEFAULT NULL,
  cliente TEXT DEFAULT NULL,
  designacao TEXT DEFAULT NULL,
  abertura VARCHAR(50) DEFAULT NULL,
  cf_executante VARCHAR(50) DEFAULT NULL,
  ultima_atualizacao DATETIME DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'ATIVO',
  detalhes_title TEXT DEFAULT NULL,
  PRIMARY KEY (num_recup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_recs_status_updated ON recs (status, ultima_atualizacao DESC);
CREATE INDEX idx_recs_cf_executante ON recs (cf_executante);
