-- CRM: nome_fantasia (razão social exibida no portal BSOD)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_crm_clients
  ADD COLUMN nome_fantasia VARCHAR(255) NOT NULL DEFAULT '' AFTER cadastro_responsavel;
