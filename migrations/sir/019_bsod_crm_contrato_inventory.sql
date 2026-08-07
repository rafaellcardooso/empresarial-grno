-- CRM: contrato_netsms para join; inventário: cliente + cadastro_responsavel do portal
-- Applied by: npm run db:migrate

ALTER TABLE bsod_crm_clients
  ADD COLUMN contrato_netsms VARCHAR(64) NOT NULL DEFAULT '' AFTER cvlan,
  ADD KEY ix_bsod_crm_ope_contrato_netsms (ope, contrato_netsms);

ALTER TABLE bsod_inventory
  ADD COLUMN cliente VARCHAR(255) NOT NULL DEFAULT '' AFTER profile,
  ADD COLUMN cadastro_responsavel VARCHAR(255) NOT NULL DEFAULT '' AFTER cliente;
