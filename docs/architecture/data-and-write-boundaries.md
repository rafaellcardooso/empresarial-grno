# Fronteiras de dados e escrita

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Quem lê e quem escreve em cada banco. Esta é a fonte de verdade arquitetural; regras Cursor e READMEs devem espelhá-la.

## MySQL SIR (`claroEmpresarial`)

| Writer               | Tabelas / escopo                                                                                                                                         | Não escreve                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `workers/sir-ingest` | `rals`, `recs` (UPSERT + encerramento)                                                                                                                   | app__, sdh__                           |
| `workers/tmip`       | `sdh_alarms` (UPSERT / desativação)                                                                                                                      | rals, recs, app_*                      |
| Next.js BFF          | `app_users`, preferências, notificações, `app_tratativas`, `app_tratativa_events`, colunas/eventos de tratativa em `sdh_alarms` / `sdh_tratativa_events` | `rals`, `recs` como fonte de incidente |
| `npm run db:migrate` | DDL em `migrations/sir/`                                                                                                                                 | dados operacionais                     |

## MySQL HFC (`hfc-sls`)

| Componente    | Acesso                                                          |
| ------------- | --------------------------------------------------------------- |
| Next.js       | **Somente leitura** (`tbl_inventory_pme`, `tbl_monitor_pme`, …) |
| Este monorepo | **Nunca escreve** — enrich BSOD continua no projeto hfc-sls     |

## HTTP externos

| Destino      | Direção            | Notas                                                |
| ------------ | ------------------ | ---------------------------------------------------- |
| Portal SIR   | Worker → SIR       | Playwright; credenciais `SISTEMA_*`                  |
| SFTP TMIP    | Worker → SFTP      | CSV >6h; credenciais `SFTP_*`                        |
| GRB / Critel | Next → HTTP legado | Proxy; Basic Auth GRB                                |
| Telegram API | Bots → Telegram    | Tokens no `.env` do worker; bots leem só Next `/api` |

## Implicações operacionais

- Backup de schema/dados SIR afeta UI, tratativas e workers juntos.
- Rollback de código Next não desfaz DDL já aplicada.
- APIs públicas usadas pelos bots (`/api/rals`, `/api/recs`, `/api/saude`, …) não autenticam cookie — restringir exposição de rede no host.
