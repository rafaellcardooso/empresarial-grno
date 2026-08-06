# Referência — configuração (env)

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Fonte de verdade dos templates: `.env.example`, `workers/sir-ingest/.env.example`, `workers/tmip/.env.example`.

Validação: `npm run env:check` (paridade example ↔ local; `SIR_DB_*` iguais entre Next e workers).

## Blocos

| Bloco               | Chaves                                                                                                              | Uso                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| MySQL SIR           | `SIR_DB_HOST`, `SIR_DB_PORT`, `SIR_DB_USER`, `SIR_DB_PASSWORD`, `SIR_DB_NAME`                                       | Next + workers          |
| MySQL SIR (BSOD)    | tabelas `bsod_*` via `SIR_DB_*`                                                                                     | Inventário/monitor BSOD |
| MySQL HFC (legado)  | `HFC_DB_*` (opcional)                                                                                               | Não usado pelo `/bsod`  |
| TMIP SFTP           | `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASSWORD`, `SFTP_REMOTE_PATH`, `SFTP_LOCAL_PATH`, `SFTP_MAX_AGE_HOURS` | Worker TMIP             |
| App                 | `PORT`, `APP_PUBLIC_URL`                                                                                            | Next                    |
| GRB                 | `GRB_BASE_URL`, `GRB_TELNET_USERNAME`, `GRB_TELNET_PASSWORD`, opcional `GRB_TELNET_ARG0`                            | Proxy telnet            |
| Critel              | `CRITEL_BASE_URL`                                                                                                   | Gráficos                |
| Auth                | `AUTH_SECRET`, `AUTH_SESSION_DAYS`, `AUTH_SESSION_REMEMBER_DAYS`, `APP_TOUR_VERSION`, opcional `AUTH_COOKIE_SECURE` | Sessão                  |
| SMTP                | `SMTP_*` (se configurado)                                                                                           | E-mail (reset etc.)     |
| SIR portal (worker) | `SISTEMA_URL`, `SISTEMA_USUARIO`, `SISTEMA_SENHA`, …                                                                | Playwright              |
| Telegram (worker)   | `TELEGRAM_*`, `EMPRESARIAL_API_URL`                                                                                 | Bots                    |

Placeholders nos examples — nunca secrets reais no git.

Regras: `.cursor/rules/emp-env.mdc` · skill `emp-align-env`.
