-- Lotação do usuário (UF) e preferência de alertas por estado (MA/AM/PA)
-- Applied by: npm run db:migrate

ALTER TABLE app_users
  ADD COLUMN home_uf ENUM('MA', 'AM', 'PA') NULL DEFAULT NULL AFTER name;

ALTER TABLE app_user_settings
  ADD COLUMN alert_ufs VARCHAR(32) NOT NULL DEFAULT '' AFTER theme;
