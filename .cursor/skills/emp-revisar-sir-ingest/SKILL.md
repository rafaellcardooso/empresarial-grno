---
name: emp-revisar-sir-ingest
description: >-
  Revisar ou refatorar coleta SIR (AlertasRalRede.js / AlertasRecRede.js),
  states JSON, schema rals/recs e bot Telegram. Use antes de continuar frontend.
---

# Revisar SIR ingest

## Arquivos principais

| Arquivo | Função |
|---------|--------|
| `workers/sir-ingest/sources/AlertasRalRede.js` | Scraper RAL |
| `workers/sir-ingest/sources/AlertasRecRede.js` | Scraper REC |
| `workers/sir-ingest/telegram/functions/sir.py` | Bot consome `/api/rals`, `/api/recs` |
| `lib/queries/sir.ts` | Leitura Next |

## Fluxo comum (cada ciclo)

1. Abrir Chromium (Playwright) → login SIR → nova aba da aplicação.
2. Selecionar tipo (RAL ou REC) no frame `frameFiltro` → Exibir.
3. Navegar frames até `table.listaTable`.
4. Para cada linha: extrair campos → UPSERT MySQL.
5. Comparar lista atual vs `*Ativas.json` → marcar ausentes como `ENCERRADO`.
6. `browser.close()` no `finally` → agendar próximo ciclo.

## Divergências conhecidas (RAL vs REC)

| Tópico | RAL | REC |
|--------|-----|-----|
| Select tipo | `sendKeys("RAL")` | XPath opção exata `REC` |
| Estado tabela vazia | `tabelaVaziaAnterior` | `tabelaVazia` |
| Coluna detalhes DB | `detalhes` | `detalhes_title` |
| Refatoração | monolítico | helpers (`processarTabela`, `extrairDadosLinha`) |
| HTML erro | `states/error/error_page.html` fixo | arquivo com timestamp |

## Checklist de revisão

- [ ] cwd = `workers/sir-ingest`
- [ ] Paridade RAL/REC (select, retry, error dump, encerramento)
- [ ] UPSERT atualiza todos os campos mutáveis
- [ ] Detalhes/tooltip: política clara (só 1ª vez vs sempre)
- [ ] Falha de scrape não encerra tudo indevidamente
- [ ] Conexão MySQL reconecta após queda
- [ ] Sem overlap de ciclos se scrape > intervalo
- [ ] Imports/deps mortos removidos
- [ ] Schema alinhado com Next + bot
- [ ] Secrets só em `.env` / `.env.local` (gitignored)

## Prioridades sugeridas (backend)

1. Extrair módulo compartilhado (`sir-scraper-common.js`).
2. Unificar lógica de tabela vazia / encerramento.
3. RAL: usar seleção exata como REC; corrigir UPSERT incompleto.
4. Pool MySQL ou reconnect; **sem** `CREATE TABLE` no worker (usar `npm run db:migrate`).
5. Proteção anti-overlap (`isCycleRunning` flag).
6. Rotação de dumps HTML (`MAX_SCRAPE_ERROR_DUMPS`); logs JSON por ciclo.
