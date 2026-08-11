# Runbook — inventário de produção

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Use quando o estado do host for **desconhecido**. A documentação **não** afirma “pendente” ou “aplicado” sem evidência deste inventário.

## 1. Código e build

```bash
cd /usr/local/empresarial
git rev-parse --short HEAD
git status -sb
test -d .next && echo "build presente" || echo "FALTA build"
```

## 2. Env

```bash
npm run env:check
# Conferir existência (sem cat de secrets):
test -f .env.local && test -f workers/sir-ingest/.env && test -f workers/tmip/.env
test -f workers/bsod/.env && echo "bsod env ok" || echo "FALTA workers/bsod/.env"
```

## 3. Migrations aplicadas

```bash
# Via cliente MySQL com as credenciais SIR_DB_* do host, por exemplo:
# SELECT filename FROM schema_migrations ORDER BY filename;
```

Compare com arquivos em `migrations/sir/` (inclui BSOD `015`–`023`). Liste o que falta **antes** de migrar.

## 4. Units e timers

```bash
systemctl is-enabled empresarial-next sir-ingest-ral sir-ingest-rec \
  sir-telegram-ops sir-telegram-datacenter tmip-ingest.timer bsod-ingest.timer 2>/dev/null
systemctl is-active empresarial-next sir-ingest-ral sir-ingest-rec \
  sir-telegram-ops sir-telegram-datacenter 2>/dev/null
systemctl list-timers 'tmip-ingest*' 'bsod-ingest*' --no-pager
```

Confirme `User=` nas units (`datacenter`, não `rcard` / `-lab`).

## 5. Runtime workers

```bash
test -d workers/sir-ingest/.playwright-browsers && echo "playwright ok"
test -x workers/sir-ingest/telegram/venv/bin/python3 && echo "telegram venv ok"
test -x workers/tmip/venv/bin/python && echo "tmip venv ok"
test -x workers/bsod/venv/bin/python && echo "bsod venv ok"
command -v snmpwalk >/dev/null && echo "snmpwalk ok" || echo "FALTA snmpwalk"
```

## 6. Saúde da app

```bash
curl -s http://127.0.0.1:4001/empresarial/api/saude | jq
curl -s http://127.0.0.1:4001/empresarial/api/rals | jq '.status, .total_registros'
```

## Decisão

| Resultado                     | Próximo passo                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Host vazio / sem units        | [production-install.md](production-install.md)                                           |
| Código antigo, units ok       | [production-release.md](production-release.md) + migrations faltantes                    |
| Só DDL faltando               | [database-migrations.md](database-migrations.md)                                         |
| Só TMIP/Telegram/BSOD ausente | [tmip-sdh-ingest.md](tmip-sdh-ingest.md) / [telegram-bots.md](telegram-bots.md) / [bsod-ingest.md](bsod-ingest.md) |

Registre o resultado operacionalmente (issue, ticket, nota de mudança) — **não** edite histórico em `docs/changes/` como se fosse status live.
