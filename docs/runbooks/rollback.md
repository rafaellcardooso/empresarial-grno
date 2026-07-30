# Runbook — rollback

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Rollback é **por camada**. DDL aplicada não volta sozinha.

## Código (Next + workers Node)

```bash
cd /usr/local/empresarial
git fetch origin
git checkout <commit-ou-tag-conhecido>
npm ci
npm run build
sudo systemctl restart empresarial-next
# Se o scrape daquele commit for necessário:
(cd workers/sir-ingest && npm ci)
sudo systemctl restart sir-ingest-ral sir-ingest-rec
```

Prefira tag/branch de release a `git checkout` detached sem plano de retorno ao `main`.

## Env

Restaurar `.env.local` / `workers/*/.env` a partir de backup operacional (fora do git). `npm run env:check`. Restart dos serviços que leem o arquivo.

## Units systemd

Recolocar arquivos de unit da versão desejada do repo e:

```bash
sudo systemctl daemon-reload
sudo systemctl restart <unit>
```

## Telegram / TMIP (Python)

Checkout do código + `venv/bin/pip install -r requirements.txt` daquela revisão + restart das units/timer.

## DDL (migrations)

- Migrations expansivas (ENUM novo, coluna nova) em geral **não** se revertem no dia a dia.
- Índice único / constraint: pode exigir correção de dados antes de reaplicar forward.
- Plano de rollback de schema = restore de dump + alinhamento do código àquela era — coordenar com janela.

## O que o rollback de código **não** desfaz

- Linhas já gravadas em `rals` / `recs` / `sdh_alarms` / tratativas.
- Tokens e secrets alterados no host.
- Estado em `workers/sir-ingest/states/`.
