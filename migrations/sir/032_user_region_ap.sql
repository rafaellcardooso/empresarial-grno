-- Inclui Amapá (AP) na lotação do usuário
-- Applied by: npm run db:migrate

ALTER TABLE app_users
  MODIFY COLUMN home_uf ENUM('MA', 'AM', 'PA', 'AP') NULL DEFAULT NULL;
