-- SDH alarms from TMIP CSV (mais6HorasNorte)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS sdh_alarms (
  id BIGINT NOT NULL,
  gerencia VARCHAR(100) DEFAULT NULL,
  ne VARCHAR(255) DEFAULT NULL,
  porta TEXT DEFAULT NULL,
  uf VARCHAR(10) DEFAULT NULL,
  municipio VARCHAR(255) DEFAULT NULL,
  ddd VARCHAR(10) DEFAULT NULL,
  circuito VARCHAR(512) DEFAULT NULL,
  alarme VARCHAR(512) DEFAULT NULL,
  data_alarme DATETIME DEFAULT NULL,
  sir TEXT DEFAULT NULL,
  ip VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  em_tratativa TINYINT(1) NOT NULL DEFAULT 0,
  tratativa_user_id INT DEFAULT NULL,
  tratativa_marked_at DATETIME DEFAULT NULL,
  tratativa_observacao TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_sdh_alarms_active_gerencia (is_active, gerencia),
  KEY idx_sdh_alarms_active_ddd (is_active, ddd),
  KEY idx_sdh_alarms_em_tratativa (em_tratativa),
  KEY idx_sdh_alarms_tratativa_user (tratativa_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
