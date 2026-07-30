# Runbook — ingest SIR (Playwright)

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Contrato do worker: [../../workers/sir-ingest/README.md](../../workers/sir-ingest/README.md).

## Produção — install / update

```bash
cd /usr/local/empresarial/workers/sir-ingest
npm ci   # ou npm install
export PLAYWRIGHT_BROWSERS_PATH=/usr/local/empresarial/workers/sir-ingest/.playwright-browsers
npm run install:browsers   # primeira vez ou após limpeza
sudo systemctl restart sir-ingest-ral sir-ingest-rec
```

Units: `workers/sir-ingest/deploy/systemd/sir-ingest-*.service`.

## Lab

Units `sir-ingest-*-lab` — ver [../getting-started/development.md](../getting-started/development.md).

## Validação

```bash
sudo journalctl -u sir-ingest-ral -u sir-ingest-rec -n 40 --no-pager
sudo journalctl -u sir-ingest-ral --since today | grep scrape_cycle
curl -s http://127.0.0.1:3003/api/rals | jq '.status, .total_registros'
```

`states/*.json` é runtime local e **não** entra no git.
