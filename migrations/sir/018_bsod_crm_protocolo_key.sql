-- Catálogo CRM completo: chave (ope, protocolo); cvlan só para join quando numérica
-- Applied by: npm run db:migrate

ALTER TABLE bsod_crm_clients
  ADD COLUMN protocolo VARCHAR(64) NOT NULL DEFAULT '' AFTER ope;

UPDATE bsod_crm_clients SET protocolo = CONCAT('legacy-', id) WHERE protocolo = '';

ALTER TABLE bsod_crm_clients
  DROP INDEX uq_bsod_crm_ope_cvlan,
  ADD UNIQUE KEY uq_bsod_crm_ope_protocolo (ope, protocolo);
