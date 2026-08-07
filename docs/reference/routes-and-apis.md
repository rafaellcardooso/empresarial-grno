# Referência — rotas e APIs

> Última revisão: **2026-08-06** · Índice: [../README.md](../README.md)

Catálogo operacional. Rotas autenticadas exigem cookie de sessão, salvo as APIs públicas usadas pelos bots.

## Páginas (UI)

| Rota                                                                   | Descrição                           |
| ---------------------------------------------------------------------- | ----------------------------------- |
| `/`                                                                    | Dashboard                           |
| `/sir`, `/sir/rals`, `/sir/recs`                                       | RAL/REC + tratativas + normalizados |
| `/bsod`, `/bsod/inventario`                                            | Alarmes / inventário PME            |
| `/sdh`                                                                 | Alarmes TMIP                        |
| `/grb`, `/grb/critel`                                                  | TELNET / Critel                     |
| `/relatorios`, `/relatorios/tratativas`, `/sir`, `/sdh`, `/exportacao` | Relatórios                          |
| `/admin/usuarios`, `/admin/notificacoes`                               | Staff                               |
| `/conta`, `/configuracoes`                                             | Perfil / preferências               |

## APIs públicas (bots / saúde)

| Método | Rota                               | Notas                                                        |
| ------ | ---------------------------------- | ------------------------------------------------------------ |
| GET    | `/api/saude`                       | Ping SIR + HFC                                               |
| GET    | `/api/rals`, `/api/recs`           | Ativos; resposta objeto com `.status`, `.total_registros`    |
| GET    | `/api/rals/contagem_por_cf`        | Contagem por CF                                              |
| GET    | `/api/rals/:num`, `/api/recs/:num` | Detalhe                                                      |
| GET    | `/api/sir/*`, `/api/bsod`          | Também consumíveis sem cookie (escopo amplo — proteger rede) |

## APIs autenticadas (amostra)

| Área         | Rotas                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| SIR BFF      | `GET /api/sir/rals`, `/api/sir/recs`                                                              |
| BSOD         | `GET /api/bsod`; `PATCH /api/bsod/inventory/[mac]` (cliente/cadastro/designação/endereço)         |
| SDH          | `GET/PATCH /api/sdh`, `/api/sdh/:id/status`                                                       |
| Tratativas   | `/api/tratativas`, `/open`, `/observacao`, `/acionamento`, `/validacao*`, `/concluir`, `/release` |
| GRB          | `/api/grb/execute`, `/interfaces`, `/vprn`, `/console` (staff), `/critel/graph`                   |
| Export       | `/api/export/sir/*`, `/api/export/bsod`, `/api/export/sdh`, `/api/export/relatorios/*`            |
| Auth / admin | login, cadastro, reset, `/api/admin/*`, notificações, preferências                                |

Lista completa: arquivos em `app/api/**/route.ts`.

## Autorização resumida

| Recurso                          | USER | STAFF |
| -------------------------------- | ---- | ----- |
| Monitores e relatórios           | Sim  | Sim   |
| GRB ping                         | Sim  | Sim   |
| GRB demais comandos / console    | Não  | Sim   |
| Admin                            | Não  | Sim   |
| Rankings sensíveis em relatórios | Não  | Sim   |
