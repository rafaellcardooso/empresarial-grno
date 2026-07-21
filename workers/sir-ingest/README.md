# SIR ingest

Workers que **gravam** no MySQL `sir` (RAL/REC via Playwright no SIR legado).

Não faz parte do Next.js — rode via systemd ou `npm run start:ral` / `start:rec`.

## Setup

```bash
cd workers/sir-ingest
cp .env.example .env
npm install
npm run install:browsers
cd ../.. && npm run env:check
```

Credenciais MySQL via `SIR_DB_*` no `.env` (mesmas da raiz `.env.local`).

## Estrutura

```
sources/          AlertasRalRede.js / AlertasRecRede.js
sources/lib/      sir-scraper-common.js (Playwright)
states/           JSON de ciclo + error/ (gitignored)
telegram/         bot (lê EMPRESARIAL_API_URL → Next /api)
deploy/systemd/   units (logs → journal)
```

Schema MySQL: `npm run db:migrate` na raiz do projeto (não no worker).

## Execução

```bash
npm run start:ral
npm run start:rec
```

Para promover a `/usr/local/sir-ingest` (requer root):

```bash
sudo mv /usr/local/empresarial/workers/sir-ingest /usr/local/sir-ingest
# ajustar WorkingDirectory nos .service
```
