-- Tratativas de RAL, REC e BSOD (assunção/liberação com histórico)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS app_tratativas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  record_kind ENUM('RAL', 'REC', 'BSOD') NOT NULL,
  record_key VARCHAR(128) NOT NULL,
  user_id INT NOT NULL,
  note VARCHAR(500) NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME NULL,
  released_by INT NULL,
  PRIMARY KEY (id),
  KEY idx_tratativa_record_active (record_kind, record_key, released_at),
  KEY idx_tratativa_user_active (user_id, released_at),
  CONSTRAINT fk_tratativa_user FOREIGN KEY (user_id) REFERENCES app_users (id),
  CONSTRAINT fk_tratativa_released_by FOREIGN KEY (released_by) REFERENCES app_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_tratativa_events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tratativa_id BIGINT NULL,
  record_kind ENUM('RAL', 'REC', 'BSOD') NOT NULL,
  record_key VARCHAR(128) NOT NULL,
  event_type ENUM('START', 'RELEASE') NOT NULL,
  user_id INT NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tratativa_events_record (record_kind, record_key, created_at DESC),
  CONSTRAINT fk_tratativa_events_user FOREIGN KEY (user_id) REFERENCES app_users (id),
  CONSTRAINT fk_tratativa_events_tratativa FOREIGN KEY (tratativa_id) REFERENCES app_tratativas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
