# Referência — modelo de dados (SIR app)

> Última revisão: **2026-08-06** · Índice: [../README.md](../README.md)

Schema versionado em `migrations/sir/`. Fronteiras: [../architecture/data-and-write-boundaries.md](../architecture/data-and-write-boundaries.md).

## Tabelas-fonte (workers)

| Tabela       | Writer         | Notas                                                   |
| ------------ | -------------- | ------------------------------------------------------- |
| `rals`       | sir-ingest RAL | Status ATIVO/ENCERRADO                                  |
| `recs`       | sir-ingest REC | Prefixo REC/DSR/TCQ                                     |
| `sdh_alarms` | tmip           | `is_active`; colunas de tratativa atualizadas pelo Next |

### BSOD (SIR — writer `workers/bsod`)

| Tabela                | Notas                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `bsod_cables`         | Sweep Xpertrak (MAC, node, IP, endereço físico do PathTrak)                                                              |
| `bsod_monitor`        | Amostras RF (TX/RX/MER/status) — histórico                                                                               |
| `bsod_monitor_latest` | Última amostra por `(ope, mac)` (leitura rápida da UI)                                                                   |
| `bsod_crm_clients`    | Catálogo portal nocclaro; sync por UF; sem linhas `CANCELADO`                                                            |
| `bsod_inventory`      | Inventário PME/BSoD: LDAP + SNMP VLAN + enrich CRM; `manual_override` preserva edição na UI; `crm_cvlan` quando casa CRM |

Join inventário ↔ CRM: `contrato` LDAP ↔ `contrato_netsms`; fallback `vlan` ↔ `cvlan` única ≠ 0.  
Campos de cliente/endereço também editáveis na UI (`manual_override=1`).

Legado HFC (não usado pela UI): `tbl_inventory_pme` / `tbl_monitor_pme`.

## Aplicação (Next)

| Tabela                      | Uso                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `app_users`                 | Cadastro / roles / status                                                               |
| `app_tratativas`            | Assunção ativa (`released_at` nulo)                                                     |
| `app_tratativa_events`      | Cronologia (`START`, `RELEASE`, `ACIONAMENTO`, `OBSERVACAO`, `VALIDACAO*`, `CONCLUIDA`) |
| `sdh_tratativa_events`      | Cronologia SDH (`START`, `OBSERVACAO`, `CLOSE`, …)                                      |
| Preferências / notificações | Conta e admin                                                                           |

Next também atualiza colunas de inventário BSOD em edição manual (`cliente`, `cadastro_responsavel`, `designacao`, `address`, `manual_override`).

## Normalizados

Quando a fonte normaliza e a tratativa continua ativa:

| Domínio | Condição                         | UI                                  |
| ------- | -------------------------------- | ----------------------------------- |
| BSOD    | online + tratativa               | Normalizados aguardando validação   |
| RAL/REC | `ENCERRADO` + tratativa          | Normalizados aguardando confirmação |
| SDH     | `is_active=0` + `em_tratativa=1` | Normalizados aguardando confirmação |
