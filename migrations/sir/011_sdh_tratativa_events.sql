-- Histórico append-only das atualizações de tratativa SDH
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS sdh_tratativa_events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  alarm_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  event_type ENUM('UPDATE', 'CLOSE') NOT NULL DEFAULT 'UPDATE',
  observacao TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sdh_tratativa_events_alarm_created (alarm_id, created_at),
  KEY idx_sdh_tratativa_events_user (user_id),
  CONSTRAINT fk_sdh_tratativa_events_alarm
    FOREIGN KEY (alarm_id) REFERENCES sdh_alarms (id) ON DELETE CASCADE,
  CONSTRAINT fk_sdh_tratativa_events_user
    FOREIGN KEY (user_id) REFERENCES app_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO sdh_tratativa_events
  (alarm_id, user_id, event_type, observacao, created_at)
SELECT
  id,
  tratativa_user_id,
  'UPDATE',
  tratativa_observacao,
  COALESCE(tratativa_marked_at, updated_at)
FROM sdh_alarms
WHERE tratativa_user_id IS NOT NULL
  AND NULLIF(TRIM(tratativa_observacao), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sdh_tratativa_events e
    WHERE e.alarm_id = sdh_alarms.id
  );
