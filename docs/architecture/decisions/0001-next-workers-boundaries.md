# ADR 0001 — Fronteiras Next / workers

- **Status:** Aceito
- **Data:** 2026-07-30

## Contexto

O monorepo combina UI Next.js, scrapers Playwright e ingest SFTP. Sem fronteiras claras, scrapers acabam dentro do App Router ou o BFF passa a gravar tabelas-fonte.

## Decisão

- Scrapers e bots ficam em `workers/`; Next não executa Selenium/Playwright.
- Tabelas-fonte de incidente (`rals`, `recs`, upsert bruto de `sdh_alarms`) são escritas só pelos workers.
- Next escreve apenas tabelas de aplicação no SIR (auth, preferências, notificações, tratativas).
- Este repo não escreve no MySQL `hfc-sls`.

## Consequências

- Deploy de UI e scrape pode ser independente.
- Migrations SIR afetam Next e workers; coordenar `db:migrate` no release.
- Documentação e regras Cursor devem refletir a escrita parcial do Next (não “read-only absoluto”).
