-- Garante no máximo uma tratativa ativa por domínio/chave (BSOD/RAL/REC).
-- Applied by: npm run db:migrate

-- Remove duplicatas ativas mantendo a mais antiga.
DELETE t1 FROM app_tratativas t1
INNER JOIN app_tratativas t2
  ON t1.record_kind = t2.record_kind
 AND t1.record_key = t2.record_key
 AND t1.released_at IS NULL
 AND t2.released_at IS NULL
 AND t1.id > t2.id;

ALTER TABLE app_tratativas
  ADD COLUMN active_guard VARCHAR(192)
    GENERATED ALWAYS AS (
      CASE
        WHEN released_at IS NULL THEN CONCAT(record_kind, ':', record_key)
        ELSE NULL
      END
    ) STORED,
  ADD UNIQUE KEY uq_app_tratativas_active (active_guard);
