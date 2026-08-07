# Fronteiras de dados e escrita

> Última revisão: **2026-08-06** · Índice: [../README.md](../README.md)

Quem lê e quem escreve em cada banco. Esta é a fonte de verdade arquitetural; regras Cursor e READMEs devem espelhá-la.

## MySQL SIR (`claroEmpresarial`)

| Writer               | Tabelas / escopo                                                                                                                                                                                               | Não escreve                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `workers/sir-ingest` | `rals`, `recs` (UPSERT + encerramento)                                                                                                                                                                         | app__, sdh__, bsod_*                   |
| `workers/tmip`       | `sdh_alarms` (UPSERT / desativação)                                                                                                                                                                            | rals, recs, app__, bsod__              |
| `workers/bsod`       | `bsod_cables`, `bsod_inventory`, `bsod_monitor`, `bsod_crm_clients`                                                                                                                                            | rals, recs, sdh__, app__               |
| Next.js BFF          | `app_users`, preferências, notificações, `app_tratativas`, `app_tratativa_events`, colunas/eventos de tratativa em `sdh_alarms` / `sdh_tratativa_events`; edição manual em `bsod_inventory` (cliente/endereço) | `rals`, `recs` como fonte de incidente |
| `npm run db:migrate` | DDL em `migrations/sir/`                                                                                                                                                                                       | dados operacionais                     |

## MySQL HFC (`hfc-sls`)

| Componente    | Acesso                                     |
| ------------- | ------------------------------------------ |
| Next.js       | Sem leitura BSOD (domínio migrou para SIR) |
| Este monorepo | **Nunca escreve** no MySQL hfc-sls         |

Legado: tabelas `tbl_inventory_pme` / `tbl_monitor_pme` no HFC podem existir até desligamento do enrich; a UI empresarial não as usa mais.

## HTTP externos

| Destino         | Direção             | Notas                                                |
| --------------- | ------------------- | ---------------------------------------------------- |
| Portal SIR      | Worker → SIR        | Playwright; credenciais `SISTEMA_*`                  |
| Portal CRM BSOD | Worker BSOD → HTTPS | `bsod.nocclaro.com.br`; `BSOD_NOCCLARO_*`            |
| SFTP TMIP       | Worker → SFTP       | CSV >6h; credenciais `SFTP_*`                        |
| Xpertrak        | Worker BSOD → API   | Por cidade (`xpertrak.sls` / `.mns` / `.blm`)        |
| CMTS SNMP       | Worker BSOD → CMTS  | VLAN L2VPN BSoD (`bsod_vlan` / `vlan`)               |
| LDAP            | Worker BSOD → LDAP  | Contrato/profile por cidade                          |
| GRB / Critel    | Next → HTTP legado  | Proxy; Basic Auth GRB                                |
| Telegram API    | Bots → Telegram     | Tokens no `.env` do worker; bots leem só Next `/api` |

## Implicações operacionais

- Backup de schema/dados SIR afeta UI, tratativas e workers juntos.
- Rollback de código Next não desfaz DDL já aplicada.
- APIs públicas usadas pelos bots (`/api/rals`, `/api/recs`, `/api/saude`, …) não autenticam cookie — restringir exposição de rede no host.
