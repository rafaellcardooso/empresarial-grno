-- Evento ACIONAMENTO e texto completo da mensagem WhatsApp
-- Applied by: npm run db:migrate

ALTER TABLE app_tratativa_events
  MODIFY event_type ENUM('START', 'RELEASE', 'ACIONAMENTO') NOT NULL,
  ADD COLUMN message_text TEXT NULL AFTER note;
