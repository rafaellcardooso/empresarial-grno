-- Contato principal do cliente no inventário BSOD (origem CRM nocclaro)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN contato_cliente_nome_1 VARCHAR(255) NOT NULL DEFAULT '' AFTER crm_cvlan,
  ADD COLUMN contato_cliente_telefone_1 VARCHAR(64) NOT NULL DEFAULT '' AFTER contato_cliente_nome_1;
