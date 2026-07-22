-- Preferência de tema por usuário (Empresarial GRNO)
-- Applied by: npm run db:migrate

ALTER TABLE app_user_settings
  ADD COLUMN theme ENUM('light', 'dark') NOT NULL DEFAULT 'light' AFTER tour_completed_version;
