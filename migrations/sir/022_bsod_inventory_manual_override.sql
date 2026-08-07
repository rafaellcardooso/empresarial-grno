-- Preserva preenchimento manual de cliente/endereço quando o CRM não casa o contrato.
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN manual_override TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = cliente/cadastro/designacao/address editados na UI; ciclo não sobrescreve sem CRM'
    AFTER address;
