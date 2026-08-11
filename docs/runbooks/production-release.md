# Runbook — release de produção

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Atualização rotineira quando o host **já** está instalado. Se o estado for desconhecido, rode antes [production-inventory.md](production-inventory.md).

## Sequência padrão

```bash
cd /usr/local/empresarial
git pull origin main
npm ci
npm run env:check          # se .env.example mudou — alinhar .env.local e workers
npm run db:migrate         # se migrations/sir/ mudou — ver database-migrations.md
npm run deploy:next        # build + sudo systemctl restart (detecta unit ativa)
# equivalente: npm run build && sudo systemctl restart empresarial-next
# depois: restart seletivo dos workers (tabela abaixo)
```

Atalho só do Next (sem `git pull` / `npm ci`):

```bash
npm run deploy:next
# lab explícito:
npm run deploy:next -- empresarial-next-lab
```

Manter **devDependencies** no `npm ci` do host: `next build` depende delas.

## Restart seletivo

| O que mudou                      | Ação                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Só `app/`, `components/`, `lib/` | Build + restart **`empresarial-next`**                                                                     |
| `workers/sir-ingest/` (scrape)   | `cd workers/sir-ingest && npm ci` (ou install) + restart **RAL/REC**                                       |
| `workers/sir-ingest/telegram/`   | `venv/bin/pip install -r requirements.txt` + restart **sir-telegram-***                                    |
| `workers/tmip/`                  | pip no venv se requirements mudou + `sudo systemctl restart tmip-ingest.timer`                             |
| `workers/bsod/`                  | pip no venv se requirements mudou + alinhar `.env` CRM/cidade + `sudo systemctl start bsod-ingest.service` |
| `migrations/sir/`                | `npm run db:migrate` **antes** do restart do Next                                                          |
| `.env.example` (novas chaves)    | Atualizar três `.env*`; `npm run env:check`                                                                |

Evite o atalho que reinicia ingest em todo release — interrompe o ciclo de scrape.

## Smoke pós-release

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq '.status, .total_registros'
sudo systemctl status empresarial-next --no-pager
```

UI autenticada conforme o que mudou (`/sdh`, `/bsod`, `/relatorios`, …).
Timers: `systemctl list-timers 'tmip-ingest*' 'bsod-ingest*'`.

## Telegram (se `telegram/` mudou)

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
venv/bin/pip install -r requirements.txt
sudo systemctl restart sir-telegram-ops sir-telegram-datacenter
```

Só após Next OK.

## Referências

- Install: [production-install.md](production-install.md)
- Migrations: [database-migrations.md](database-migrations.md)
- Rollback: [rollback.md](rollback.md)
- Modelo: [../operations/deployment.md](../operations/deployment.md)
