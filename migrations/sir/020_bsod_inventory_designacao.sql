-- Inventário BSOD: designacao do portal CRM (join por contrato_netsms)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN designacao VARCHAR(255) NOT NULL DEFAULT '' AFTER cadastro_responsavel;
