# Runbook — ingest TMIP / SDH

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Contrato do worker: [../../workers/tmip/README.md](../../workers/tmip/README.md).

## Pré-requisitos

- Migrations SIR com tabelas `sdh_*` aplicadas (`009+`; tipagem de eventos `014` se o código atual exigir).
- `workers/tmip/.env` com `SIR_DB_*` iguais ao Next e `SFTP_*` (+ `SFTP_MAX_AGE_HOURS`).
- `npm run env:check` na raiz.

## Produção

```bash
cd /usr/local/empresarial/workers/tmip
python3 -m venv venv
venv/bin/pip install -r requirements.txt

cd /usr/local/empresarial
sudo cp workers/tmip/deploy/systemd/tmip-ingest.service /etc/systemd/system/
sudo cp workers/tmip/deploy/systemd/tmip-ingest.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tmip-ingest.timer
```

Smoke oneshot:

```bash
cd /usr/local/empresarial/workers/tmip
venv/bin/python ingest_sdh.py
sudo journalctl -u tmip-ingest -n 50 --no-pager
```

## Lab

Units em `workers/tmip/deploy/systemd/lab/` (`tmip-ingest-lab.timer`).

## Validação

- Timer ativo: `systemctl list-timers 'tmip-ingest*'`
- UI autenticada: `/sdh` (não use `curl` anônimo em `/api/sdh` — exige sessão)
- CSV vazio/desatualizado: processo sai com erro **sem** fechar o backlog (comportamento esperado)
- IDs duplicados no CSV: mantém a última ocorrência no arquivo (loga aviso; não aborta)

## Update

Se mudou `requirements.txt` ou o script: pip install + `sudo systemctl restart tmip-ingest.timer`.
