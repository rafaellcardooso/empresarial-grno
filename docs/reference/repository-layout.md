# Referência — estrutura do repositório

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

```
empresarial/
  app/(shell)/          # páginas autenticadas
  app/api/              # Route Handlers (BFF)
  components/           # UI React
  lib/                  # queries, config, grb, critel, tratativa
  migrations/sir/       # DDL versionado
  workers/sir-ingest/   # Playwright + bots Telegram
  workers/tmip/         # SFTP CSV → sdh_alarms
  docs/                 # documentação (este índice)
  deploy/               # units systemd (inventário)
```

Documentação canônica: [../README.md](../README.md). Workers: READMEs co-localizados apenas para contrato/dev local.
