# Referência — modelo de dados (SIR app)

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Schema versionado em `migrations/sir/`. Fronteiras: [../architecture/data-and-write-boundaries.md](../architecture/data-and-write-boundaries.md).

## Tabelas-fonte (workers)

| Tabela       | Writer         | Notas                                                   |
| ------------ | -------------- | ------------------------------------------------------- |
| `rals`       | sir-ingest RAL | Status ATIVO/ENCERRADO                                  |
| `recs`       | sir-ingest REC | Prefixo REC/DSR/TCQ                                     |
| `sdh_alarms` | tmip           | `is_active`; colunas de tratativa atualizadas pelo Next |

## Aplicação (Next)

| Tabela                      | Uso                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `app_users`                 | Cadastro / roles / status                                                               |
| `app_tratativas`            | Assunção ativa (`released_at` nulo)                                                     |
| `app_tratativa_events`      | Cronologia (`START`, `RELEASE`, `ACIONAMENTO`, `OBSERVACAO`, `VALIDACAO*`, `CONCLUIDA`) |
| `sdh_tratativa_events`      | Cronologia SDH (`START`, `OBSERVACAO`, `CLOSE`, …)                                      |
| Preferências / notificações | Conta e admin                                                                           |

## HFC (somente leitura)

`bsod_cables`, `bsod_inventory`, `bsod_monitor`, `bsod_crm_clients` (SIR) — BSOD. Legado HFC: `tbl_inventory_pme` / `tbl_monitor_pme`.

## Normalizados

Quando a fonte normaliza e a tratativa continua ativa:

| Domínio | Condição                         | UI                                  |
| ------- | -------------------------------- | ----------------------------------- |
| BSOD    | online + tratativa               | Normalizados aguardando validação   |
| RAL/REC | `ENCERRADO` + tratativa          | Normalizados aguardando confirmação |
| SDH     | `is_active=0` + `em_tratativa=1` | Normalizados aguardando confirmação |
