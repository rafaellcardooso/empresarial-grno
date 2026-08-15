-- Status de registro DOCS-IF no CMTS (segunda validação de offline BSOD)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN cmts_reg_status SMALLINT NULL DEFAULT NULL
    COMMENT 'docsIfCmtsCmStatusValue SNMP (8=operational)' AFTER vlan,
  ADD COLUMN cmts_status_at DATETIME NULL DEFAULT NULL AFTER cmts_reg_status;
