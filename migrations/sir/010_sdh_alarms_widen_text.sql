-- Widen SDH CSV columns after real TMIP sample lengths
-- Applied by: npm run db:migrate

ALTER TABLE sdh_alarms
  MODIFY COLUMN porta TEXT DEFAULT NULL,
  MODIFY COLUMN circuito VARCHAR(512) DEFAULT NULL,
  MODIFY COLUMN alarme VARCHAR(512) DEFAULT NULL;
