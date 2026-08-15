-- Ping ICMP desempate (PathTrak offline + CMTS operational + IP PME)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN ping_reachable TINYINT NULL DEFAULT NULL
    COMMENT '1=ICMP ok, 0=falhou 3 tentativas; NULL=não testado' AFTER cmts_status_at,
  ADD COLUMN ping_checked_at DATETIME NULL DEFAULT NULL AFTER ping_reachable;
