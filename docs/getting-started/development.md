# Getting started — lab / desenvolvimento

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Ambiente de **lab** (WSL ou Debian de desenvolvimento): usuário típico **`rcard`**, units com sufixo **`-lab`**, dados SIR via snapshot (`db:import`) ou ingest opcional.

Produção: [../runbooks/production-install.md](../runbooks/production-install.md).

**Não** misture units lab e prod no mesmo host (porta **4001**, path `/empresarial` e `states/` do ingest).

## Pré-requisitos

Node.js 20+, MariaDB/MySQL (SIR + leitura HFC), Git, repo em `/usr/local/empresarial`.

## Env e deps

```bash
cd /usr/local/empresarial
cp .env.example .env.local
cp workers/sir-ingest/.env.example workers/sir-ingest/.env
cp workers/tmip/.env.example workers/tmip/.env   # se for usar SDH
cp workers/bsod/.env.example workers/bsod/.env   # se for usar BSOD (alinhamento manual)
npm install
npm run env:check
```

Detalhes: [../reference/configuration.md](../reference/configuration.md).

## Banco

Ver [database.md](database.md). Em lab: `db:import` ok. Em prod: **proibido**.

## Next.js

```bash
npm run dev    # http://127.0.0.1:4001/empresarial
```

Ou unit:

```bash
sudo cp deploy/systemd/lab/empresarial-next-lab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now empresarial-next-lab
```

## Workers (opcional)

- SIR: [../runbooks/sir-ingest.md](../runbooks/sir-ingest.md) — units `sir-ingest-*-lab`
- TMIP: [../runbooks/tmip-sdh-ingest.md](../runbooks/tmip-sdh-ingest.md) — `tmip-ingest-lab.timer`
- BSOD: [../runbooks/bsod-ingest.md](../runbooks/bsod-ingest.md) — `bsod-ingest-lab.timer`
- Telegram: [../runbooks/telegram-bots.md](../runbooks/telegram-bots.md) — `sir-telegram-*-lab`

## Validação

```bash
curl -s http://127.0.0.1:4001/empresarial/api/saude | jq
curl -s http://127.0.0.1:4001/empresarial/api/rals | jq '.status, .total_registros'
```

## Atualização no lab

```bash
git pull origin main
npm install
npm run db:migrate   # se migrations mudaram
sudo systemctl restart empresarial-next-lab   # se usa a unit
```

## Lab vs produção

| Aspecto        | Lab              | Produção          |
| -------------- | ---------------- | ----------------- |
| Usuário        | `rcard`          | `datacenter`      |
| Next           | `dev`            | `build` + `start` |
| Dados iniciais | `db:import` ok   | só ingest         |
| Deps raiz      | `npm install` ok | `npm ci`          |
