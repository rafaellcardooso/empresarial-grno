-- Observações de tratativa e acionamentos SDH
-- Applied by: npm run db:migrate

ALTER TABLE app_tratativa_events
  MODIFY event_type ENUM(
    'START',
    'RELEASE',
    'ACIONAMENTO',
    'OBSERVACAO',
    'VALIDACAO_SOLICITADA',
    'VALIDACAO',
    'CONCLUIDA'
  ) NOT NULL;

ALTER TABLE sdh_tratativa_events
  MODIFY event_type ENUM('UPDATE', 'CLOSE', 'ACIONAMENTO') NOT NULL DEFAULT 'UPDATE';
