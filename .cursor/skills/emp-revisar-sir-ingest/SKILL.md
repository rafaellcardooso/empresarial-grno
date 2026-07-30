---
name: emp-revisar-sir-ingest
description: >-
  Revisar ou refatorar coleta SIR (AlertasRalRede.js / AlertasRecRede.js),
  states JSON, schema rals/recs e bot Telegram. Use antes de continuar frontend.
---

# Revisar SIR ingest

Docs: `workers/sir-ingest/README.md` · runbook: `docs/runbooks/sir-ingest.md`.

## Arquivos principais

| Arquivo                                             | Função                            |
| --------------------------------------------------- | --------------------------------- |
| `sources/AlertasRalRede.js` / `AlertasRecRede.js`   | Scrapers                          |
| `sources/lib/sir-scraper-common.js`                 | Playwright + sessão compartilhada |
| `telegram/main-ops-bot.py` / `notify-datacenter.py` | Bots HTTP → Next                  |
| `lib/queries/sir.ts`                                | Leitura Next                      |

## Fluxo atual (cada ciclo)

1. `ensurePage` — reutiliza browser/sessão; login só na abertura, erro ou `SESSION_MAX_CYCLES`.
2. Filtro RAL/REC nos frames SIR → parse `table.listaTable`.
3. UPSERT MySQL; ausentes confirmados → `ENCERRADO` (com salvaguardas de tabela vazia / cliff).
4. Sem `browser.close()` a cada ciclo; overlap bloqueado se ciclo ainda roda.
5. Logs JSON `scrape_cycle` no journal.

## Checklist

- [ ] cwd = `workers/sir-ingest`
- [ ] Paridade RAL/REC (retry, error dump, encerramento)
- [ ] UPSERT atualiza campos mutáveis
- [ ] Tabela vazia / login fresco não encerra indevidamente
- [ ] Sem overlap de ciclos
- [ ] Schema alinhado com Next (`npm run db:migrate` — sem DDL no worker)
- [ ] Secrets só em `.env` gitignored
- [ ] Smoke: `jq '.status, .total_registros'` em `/api/rals` (não `jq length`)
