# BSOD ingest (PME / BSoD)

Worker Python que varre Xpertrak (modems PME), coleta VLAN via SNMP nos CMTS e enriquece LDAP, gravando em `bsod_cables`, `bsod_inventory` e `bsod_monitor` (MySQL SIR).

Arquitetura: [docs/architecture/decisions/0004-bsod-sir-ownership.md](../../docs/architecture/decisions/0004-bsod-sir-ownership.md).

## Setup local

```bash
cd workers/bsod
cp .env.example .env
# SIR_DB_* iguais à raiz; credenciais Xpertrak/LDAP/SNMP
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# migration SIR (na raiz do monorepo)
cd ../.. && npm run db:migrate && cd workers/bsod

venv/bin/python run_bsod_cycle.py --ope sls
```

Cidades em `config/cities/*.json`. `enabled: true` só em SLS por padrão; MNS/BLM aguardam lista de CMTS.

## Comportamento

1. Lista nodes Xpertrak → `qoe/modems` → upsert `bsod_cables` + amostras `bsod_monitor` (PME por IP ou MAC já no inventário).
2. SNMP L2VPN + LDAP → upsert `bsod_inventory` + cleanup de órfãos.
3. Timer systemd a cada 6h (`bsod-ingest.timer` / lab `bsod-ingest-lab.timer`).

## Estrutura

```
run_bsod_cycle.py
config/cities/{sls,mns,blm}.json
lib/
requirements.txt
.env.example
deploy/systemd/          # prod
deploy/systemd/lab/      # lab
```
