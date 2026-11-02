# Runbook — sync Planta instalada

> Última revisão: **2026-10-05** · Índice: [../README.md](../README.md)

Contrato do worker: [../../workers/planta/README.md](../../workers/planta/README.md).

Copia diariamente `db_planta.planta_instalada` (MySQL Terminal) para `tbl_planta_instalada` (MySQL SIR). Espelho completo: a tabela é substituída a cada ciclo numa única transação.

## Pré-requisitos

- Migration `029_planta_instalada.sql` aplicada (`npm run db:migrate`).
- `workers/planta/.env` com `SIR_DB_*` iguais ao Next e `TERMINAL_DB_HOST/USER/PASS/NAME` da origem.
- Host com rota e liberação de firewall para o MySQL Terminal (porta 3306).
- `npm run env:check` na raiz.

## Produção

```bash
cd /usr/local/empresarial/workers/planta
python3 -m venv venv
venv/bin/pip install -r requirements.txt

cd /usr/local/empresarial
sudo cp workers/planta/deploy/systemd/planta-sync.service /etc/systemd/system/
sudo cp workers/planta/deploy/systemd/planta-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now planta-sync.timer
```

Smoke oneshot:

```bash
sudo systemctl start planta-sync.service
sudo journalctl -u planta-sync -n 50 --no-pager
```

## Lab

Units em `workers/planta/deploy/systemd/lab/` (`planta-sync-lab.timer`).

## Validação

- Timer ativo: `systemctl list-timers 'planta-sync*'`
- Log esperado: `[PLANTA] Origem: N linhas; designações repetidas: D` seguido de `[PLANTA] tbl_planta_instalada substituída com N linhas`.
- Contagem: `SELECT COUNT(*), MAX(synced_at) FROM tbl_planta_instalada;` deve bater com `SELECT COUNT(*) FROM db_planta.planta_instalada;`.
- Origem vazia ou inacessível: processo sai com erro e a tabela mantém o snapshot anterior (comportamento esperado).

## Update

Se mudou `requirements.txt` ou o script: `venv/bin/pip install -r requirements.txt`. O timer usa o código novo no próximo ciclo; para rodar já, `sudo systemctl start planta-sync.service`.
