-- Cadastro de técnicos de campo por DDD e skills (catálogo em lib/config/tecnicos.ts).
-- Mantido pelo portal (STAFF: cadastro manual e importação CSV); login é a chave de upsert.
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS app_tecnicos (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  login VARCHAR(64) NOT NULL,
  ddd CHAR(2) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  un VARCHAR(6) NULL,
  telefone VARCHAR(20) NULL,
  rg VARCHAR(14) NULL,
  cpf CHAR(11) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tecnicos_login (login),
  KEY idx_tecnicos_ddd_ativo (ddd, ativo, nome),
  CONSTRAINT fk_tecnicos_updated_by FOREIGN KEY (updated_by) REFERENCES app_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_tecnico_skills (
  tecnico_id INT NOT NULL,
  skill VARCHAR(32) NOT NULL,
  PRIMARY KEY (tecnico_id, skill),
  KEY idx_tecnico_skills_skill (skill),
  CONSTRAINT fk_tecnico_skills_tecnico FOREIGN KEY (tecnico_id) REFERENCES app_tecnicos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
