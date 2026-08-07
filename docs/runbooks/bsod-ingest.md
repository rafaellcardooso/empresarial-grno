# BSOD ingest (PME / BSoD)

> Última revisão: **2026-08-06**

Coleta multi-cidade para `/bsod`. Worker: [`workers/bsod`](../../workers/bsod/README.md).

## Pré-requisitos

1. `npm run db:migrate` (inclui `015_bsod_inventory_monitor.sql` e `016_bsod_crm_clients.sql`).
2. `workers/bsod/.env` com `SIR_DB_*`, credenciais da cidade e `BSOD_NOCCLARO_USER` / `BSOD_NOCCLARO_PASS`.
3. `snmpwalk` no PATH do host (`/usr/bin/snmpwalk`).
4. Rede até Xpertrak, CMTS (SNMP), LDAP e `bsod.nocclaro.com.br`.

## Deploy

```bash
cd /usr/local/empresarial/workers/bsod
cp .env.example .env   # se ainda não existir
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# lab
sudo cp deploy/systemd/lab/bsod-ingest-lab.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bsod-ingest-lab.timer

# prod
# sudo cp deploy/systemd/bsod-ingest.* /etc/systemd/system/
# sudo systemctl enable --now bsod-ingest.timer
```

Oneshot: `sudo systemctl start bsod-ingest-lab.service`

## Habilitar MNS / BLM

1. Preencher `cmts` (ip, vendor, pme_cidr) em `config/cities/mns.json` ou `blm.json`.
2. Confirmar LDAP base/creds no `.env` (`BSOD_MNS_*` / `BSOD_BLM_*`).
3. `"enabled": true` no JSON.
4. Testar: `venv/bin/python run_bsod_cycle.py --ope mns --force` (se ainda disabled) ou sem `--force` após enabled.
