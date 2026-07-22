-- Login corporativo (matrícula) em app_users
-- Applied by: npm run db:migrate

ALTER TABLE app_users
  ADD COLUMN corporate_id VARCHAR(32) NULL AFTER id;

ALTER TABLE app_users
  DROP INDEX uk_app_users_email;

ALTER TABLE app_users
  MODIFY email VARCHAR(255) NULL DEFAULT NULL;

UPDATE app_users
  SET corporate_id = CONCAT('MIG', LPAD(id, 6, '0'))
  WHERE corporate_id IS NULL;

ALTER TABLE app_users
  MODIFY corporate_id VARCHAR(32) NOT NULL,
  ADD UNIQUE KEY uk_app_users_corporate_id (corporate_id);
