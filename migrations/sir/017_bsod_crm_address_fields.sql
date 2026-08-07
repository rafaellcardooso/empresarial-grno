-- Campos CRM: cadastro_responsavel (antes de cliente) e tipo_logradouro (endereço)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_crm_clients
  ADD COLUMN cadastro_responsavel VARCHAR(255) NOT NULL DEFAULT '' AFTER cvlan,
  ADD COLUMN tipo_logradouro VARCHAR(64) NOT NULL DEFAULT '' AFTER cliente;
