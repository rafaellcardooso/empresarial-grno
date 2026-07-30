-- Eventos tipados de tratativa SDH (START / OBSERVACAO) mantendo UPDATE legado
-- Applied by: npm run db:migrate

ALTER TABLE sdh_tratativa_events
  MODIFY event_type ENUM(
    'UPDATE',
    'CLOSE',
    'ACIONAMENTO',
    'START',
    'OBSERVACAO'
  ) NOT NULL DEFAULT 'UPDATE';
