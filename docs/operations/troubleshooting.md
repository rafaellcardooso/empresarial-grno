# Troubleshooting

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

| Sintoma                                          | Causa típica            | Correção                                                              |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `ENOENT … /root/package.json`                    | `npm` fora do repo      | `cd /usr/local/empresarial`                                           |
| `Cannot find package 'dotenv'`                   | Deps não instaladas     | `npm ci` na raiz                                                      |
| `ERROR 1698 … root@localhost`                    | Auth socket MariaDB     | `node scripts/db/bootstrap-sir.mjs \| sudo mariadb`                   |
| `Executable doesn't exist … playwright-browsers` | Chromium ausente        | Em `workers/sir-ingest`: `npm run install:browsers` (usuário da unit) |
| UI antiga após pull                              | Falta build             | `npm ci && npm run build && sudo systemctl restart empresarial-next`  |
| `api/saude` ERRO SIR                             | MySQL / credenciais     | `.env.local`, `npm run env:check`, `db:migrate`                       |
| `api/saude` ERRO HFC                             | HFC inacessível         | Conferir `HFC_DB_*` e rede até `hfc-sls`                              |
| Worker `rowErrors` alto                          | Scrape incompleto       | Journal RAL/REC; restart após fix                                     |
| Telegram `ModuleNotFoundError`                   | `PYTHONPATH` indevido   | Remover `PYTHONPATH` das units; usar `venv/bin/python3`               |
| Unit Next falha ao start                         | `.env.local` ausente    | Criar arquivo; unit prod não usa `EnvironmentFile=-`                  |
| GRB/Critel timeout                               | Rede / URL              | Curl até `GRB_BASE_URL` / `CRITEL_BASE_URL`                           |
| TELNET 403                                       | Comando staff-only      | USER só ping                                                          |
| Critel vazio                                     | Designação inválida     | Formato `LOC/TIPO/NUM`                                                |
| TMIP aborta sem fechar backlog                   | CSV vazio/desatualizado | Esperado; conferir SFTP e `SFTP_MAX_AGE_HOURS`                        |

Smoke mínimo:

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq '.status, .total_registros'
curl -s http://127.0.0.1:3003/api/rals/contagem_por_cf | jq '.status'
```

`/api/sdh` e exports CSV exigem sessão autenticada — não use curl anônimo como prova de saúde SDH.
