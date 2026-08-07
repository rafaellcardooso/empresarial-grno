-- CVLAN do catálogo CRM (nocclaro) quando o inventário casa por contrato/VLAN.
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN crm_cvlan VARCHAR(32) NOT NULL DEFAULT ''
    COMMENT 'cvlan do bsod_crm_clients após enrich; vazio se sem match CRM'
    AFTER vlan;
