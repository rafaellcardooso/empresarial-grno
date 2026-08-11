# Referência — configuração (env)

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Fonte de verdade dos templates: `.env.example`, `workers/sir-ingest/.env.example`, `workers/tmip/.env.example`, `workers/bsod/.env.example`.

Validação: `npm run env:check` (paridade example ↔ local Next/SIR/TMIP; **BSOD ainda é alinhamento manual** com `workers/bsod/.env.example`).

## Blocos

| Bloco               | Chaves                                                                                                              | Uso                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| MySQL SIR           | `SIR_DB_HOST`, `SIR_DB_PORT`, `SIR_DB_USER`, `SIR_DB_PASSWORD`, `SIR_DB_NAME`                                       | Next + workers         |
| MySQL SIR (BSOD)    | mesmas `SIR_DB_*` nas tabelas `bsod_*`                                                                              | Inventário/monitor/CRM |
| BSOD CRM            | `BSOD_NOCCLARO_BASE_URL`, `BSOD_NOCCLARO_USER`, `BSOD_NOCCLARO_PASS`                                                | Sync portal nocclaro   |
| BSOD por cidade     | `BSOD_<OPE>_XPERTRAK_*`, `BSOD_<OPE>_LDAP_*`, `BSOD_<OPE>_SNMP_COMMUNITY` (`SLS`/`MNS`/`BLM`)                       | Xpertrak / LDAP / SNMP |
| BSOD SNMP tuning    | `SNMP_TIMEOUT`, `SNMP_RETRIES`, `BSOD_SNMP_PARALLEL` (opcional)                                                     | Coleta L2VPN           |
| MySQL HFC (legado)  | `HFC_DB_*` (opcional)                                                                                               | Não usado pelo `/bsod` |
| TMIP SFTP           | `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASSWORD`, `SFTP_REMOTE_PATH`, `SFTP_LOCAL_PATH`, `SFTP_MAX_AGE_HOURS` | Worker TMIP            |
| App                 | `PORT`, `HOSTNAME`, `NEXT_PUBLIC_BASE_PATH`, `APP_PUBLIC_URL`                                                        | Next (+ Nginx)         |
| GRB                 | `GRB_BASE_URL`, `GRB_TELNET_USERNAME`, `GRB_TELNET_PASSWORD`, opcional `GRB_TELNET_ARG0`                            | Proxy telnet           |
| Critel              | `CRITEL_BASE_URL`                                                                                                   | Gráficos               |
| Auth                | `AUTH_SECRET`, `AUTH_SESSION_DAYS`, `AUTH_SESSION_REMEMBER_DAYS`, `APP_TOUR_VERSION`, opcional `AUTH_COOKIE_SECURE` | Sessão                 |
| SMTP                | `SMTP_*` (se configurado)                                                                                           | E-mail (reset etc.)    |
| SIR portal (worker) | `SISTEMA_URL`, `SISTEMA_USUARIO`, `SISTEMA_SENHA`, …                                                                | Playwright             |
| Telegram (worker)   | `TELEGRAM_*`, `EMPRESARIAL_API_URL`                                                                                 | Bots                   |

Placeholders nos examples — nunca secrets reais no git.

Portal Nginx: [../operations/deployment.md](../operations/deployment.md) (`/empresarial` → `127.0.0.1:4001`).

Detalhe operacional BSOD: [../runbooks/bsod-ingest.md](../runbooks/bsod-ingest.md).  
Regras: `.cursor/rules/emp-env.mdc` · skill `emp-align-env`.
