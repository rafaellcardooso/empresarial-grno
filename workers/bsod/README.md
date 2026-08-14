# BSOD ingest (PME / BSoD)

Worker Python que:

1. sincroniza o catálogo CRM (`bsod.nocclaro.com.br`) → `bsod_crm_clients`;
2. varre Xpertrak (modems PME) → `bsod_cables` + `bsod_monitor`;
3. coleta VLAN via SNMP nos CMTS e enriquece LDAP → `bsod_inventory`, com match CRM por contrato (fallback VLAN).

Arquitetura: [docs/architecture/decisions/0004-bsod-sir-ownership.md](../../docs/architecture/decisions/0004-bsod-sir-ownership.md).  
Runbook: [docs/runbooks/bsod-ingest.md](../../docs/runbooks/bsod-ingest.md).

## Setup local

```bash
cd workers/bsod
cp .env.example .env
# SIR_DB_* iguais à raiz; Xpertrak/LDAP/SNMP por cidade; BSOD_NOCCLARO_*
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# migration SIR (na raiz do monorepo)
cd ../.. && npm run db:migrate && cd workers/bsod

venv/bin/python run_bsod_cycle.py --ope sls
```

Cidades em `config/cities/*.json` (`uf`: MA/AM/PA). `enabled: true` só em SLS por padrão; MNS/BLM exigem `cmts` (`ip`, `vendor`, `pme_cidr`) + credenciais Xpertrak/LDAP/SNMP.

Manaus (MNS): Xpertrak `http://200.160.100.6/pathtrak/api`, 19 CMTS com faixas PME em `config/cities/mns.json` — preencher `ip` de cada CMTS para SNMP L2VPN.

## Comportamento

1. Sync CRM por UF → `bsod_crm_clients` (ignora `STATUS=CANCELADO`; falha não aborta o ciclo).
2. Xpertrak → `bsod_cables` + amostras `bsod_monitor`.
3. SNMP L2VPN + LDAP → `bsod_inventory`:
   - **produto** a partir de `profile` (`config/profiles.txt`);
   - cliente/endereço/designação: CRM por **contrato**, senão **cvlan** única, senão override manual / endereço Xpertrak;
   - cleanup de órfãos do `ope`.
4. Timer systemd a cada **30 min** (`bsod-ingest.timer` / lab `bsod-ingest-lab.timer`).

CRM só sync: `venv/bin/python run_bsod_crm_sync.py --ope sls` (ou `--dry-run`).

Planilha local (`data/BSOD.xlsx`, colunas designação/razão social/endereço/contrato) — compara contrato com `bsod_inventory` e preenche **somente campos vazios** (não insere CRM nem sobrescreve dados):

`venv/bin/python run_bsod_sheet_enrich.py --ope sls` (ou `--dry-run`).

## Estrutura

```
run_bsod_cycle.py
run_bsod_crm_sync.py
config/cities/{sls,mns,blm}.json
config/profiles.txt
lib/                 # cycle, db, nocclaro, snmp_bsod, ldap, …
scripts/ldap_lookup_mac.py
requirements.txt
.env.example
deploy/systemd/          # prod
deploy/systemd/lab/      # lab
```
