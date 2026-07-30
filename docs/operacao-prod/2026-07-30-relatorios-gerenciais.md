> **Data:** 2026-07-30 · **Escopo:** lab + prod · **Lab:** pendente · **Prod:** pendente

## Resumo

Ajustes gerenciais nos relatórios BSOD/SDH/SIR e reforço do ingest TMIP: migration `014` tipa eventos SDH (`START`/`OBSERVACAO`), o worker aborta CSV vazio/desatualizado e o hub ganha `/relatorios/sir`.

## Impacto

- Migration `migrations/sir/014_sdh_tratativa_event_types.sql`
- Env TMIP: `SFTP_MAX_AGE_HOURS` em `workers/tmip/.env.example` / `.env`
- Relatórios: coorte BSOD, histórico SDH sem filtro `is_active`, página `/relatorios/sir` + CSV `/api/export/relatorios/sir`
- Rebuild/restart do Next após deploy

## Pré-requisitos

- MySQL SIR acessível para `npm run db:migrate`
- Pares de env alinhados (`npm run env:check`)
- Worker TMIP com venv e SFTP configurados

## Passos — Lab

```bash
cd /usr/local/empresarial
npm run db:migrate
# garantir SFTP_MAX_AGE_HOURS=24 em workers/tmip/.env (mesma posição do .env.example)
npm run env:check
workers/tmip/venv/bin/python workers/tmip/ingest_sdh.py
# rebuild/restart Next lab conforme guia
```

## Passos — Produção

```bash
cd /usr/local/empresarial
git pull
npm run db:migrate
# alinhar SFTP_MAX_AGE_HOURS no .env do worker
npm run env:check
sudo systemctl restart tmip-ingest.timer
# rebuild/restart Next conforme checklist de release
```

## Validação

```bash
# migration aplicada
# schema_migrations contém 014_sdh_tratativa_event_types

# UI
# http://localhost:3003/relatorios/tratativas
# http://localhost:3003/relatorios/sdh
# http://localhost:3003/relatorios/sir

# export SIR
curl -sI 'http://127.0.0.1:3003/api/export/relatorios/sir' | head

# ingest: CSV vazio/desatualizado deve sair com código 1 sem fechar backlog
workers/tmip/venv/bin/python workers/tmip/ingest_sdh.py
```

## Rollback

- Reverter deploy do Next para a release anterior
- Migration `014` é expansiva (ENUM); não remover valores já gravados sem plano de dados
- Remover `SFTP_MAX_AGE_HOURS` só após alinhar o código antigo (default no código é 24h)

## Referências

- [docs/2026-07-26-operacao.md](../2026-07-26-operacao.md)
- [2026-07-29-tmip-sdh-ingest.md](2026-07-29-tmip-sdh-ingest.md)
- [2026-07-29-tratativa-unificada.md](2026-07-29-tratativa-unificada.md)
