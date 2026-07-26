-- Validação e conclusão do fluxo BSOD pós-acionamento
-- Applied by: npm run db:migrate

ALTER TABLE app_tratativa_events
  MODIFY event_type ENUM(
    'START',
    'RELEASE',
    'ACIONAMENTO',
    'VALIDACAO_SOLICITADA',
    'VALIDACAO',
    'CONCLUIDA'
  ) NOT NULL;
