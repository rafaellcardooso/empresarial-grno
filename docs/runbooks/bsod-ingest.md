# BSOD ingest (PME / BSoD)

> Última revisão: **2026-08-11**

Coleta multi-cidade para `/bsod`. Worker: [`workers/bsod`](../../workers/bsod/README.md).

## Pré-requisitos

1. `npm run db:migrate` (migrations BSOD `015`–`027` em `migrations/sir/`).
2. `workers/bsod/.env` com:
   - `SIR_DB_*` iguais ao Next
   - por cidade: `BSOD_<OPE>_XPERTRAK_*`, `BSOD_<OPE>_LDAP_*`, `BSOD_<OPE>_SNMP_COMMUNITY`
   - CRM: `BSOD_NOCCLARO_USER` / `BSOD_NOCCLARO_PASS` (+ opcional `BSOD_NOCCLARO_BASE_URL`)
3. `snmpwalk` no PATH (`/usr/bin/snmpwalk`).
4. Rede até Xpertrak, CMTS (SNMP), LDAP e `https://bsod.nocclaro.com.br`.

## Deploy

```bash
cd /usr/local/empresarial/workers/bsod
cp .env.example .env   # se ainda não existir — preencher secrets
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# lab
sudo cp deploy/systemd/lab/bsod-ingest-lab.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bsod-ingest-lab.timer

# prod
# sudo cp deploy/systemd/bsod-ingest.* /etc/systemd/system/
# sudo systemctl daemon-reload
# sudo systemctl enable --now bsod-ingest.timer
```

Oneshot: `sudo systemctl start bsod-ingest.service` (lab: `bsod-ingest-lab.service`).

Após mudar o `.timer` no repo:

```bash
sudo cp workers/bsod/deploy/systemd/bsod-ingest.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart bsod-ingest.timer
systemctl list-timers 'bsod-ingest*'
```

Intervalo: **30 min** (`OnUnitActiveSec=30min`).

## Persistência (update vs insert)

| Tabela             | Comportamento                                            |
| ------------------ | -------------------------------------------------------- |
| `bsod_cables`      | **UPSERT** por `(ope, mac)`                              |
| `bsod_inventory`   | **UPSERT** por `(ope, mac)`; órfãos do ope são removidos |
| `bsod_crm_clients` | **replace** do ope (DELETE + INSERT da planilha ativa)   |
| `bsod_monitor`     | **INSERT** de nova amostra a cada ciclo (histórico RF)   |

## Ciclo por cidade (`enabled: true`)

1. **CRM** — login nocclaro → busca por `uf` do JSON → planilha → `bsod_crm_clients`
   - linhas `STATUS=CANCELADO` são descartadas
   - falha de CRM **não** aborta Xpertrak/SNMP/LDAP
2. **Xpertrak** — nodes/modems → `bsod_cables` + amostras `bsod_monitor`
3. **SNMP** — VLAN L2VPN por CMTS → `bsod_vlan` / `vlan` no inventário
4. **SNMP CMTS reg** — `docsIfCmtsCmStatusValue` (`1.3.6.1.2.1.10.127.1.3.3.1.6`) → `cmts_reg_status` / `cmts_status_at`
5. **Ping PME** — 3 ICMP quando PathTrak offline + CMTS operational + `ip_ger` → `ping_reachable` / `ping_checked_at`
6. **LDAP** — contrato + profile → inventário; **produto** via `config/profiles.txt`
7. **Enrich CRM** no inventário (ordem):
   1. contrato LDAP ↔ `contrato_netsms`
   2. se falhar: VLAN SNMP ↔ `cvlan` **única** e ≠ `0`
   3. se falhar: mantém override manual (`manual_override=1`) ou endereço Xpertrak

Campos manuais na UI (`PATCH /api/bsod/inventory/[mac]`): cliente, cadastro responsável, designação, endereço, **CVLAN CRM**.

## Env CRM (produção)

```bash
BSOD_NOCCLARO_BASE_URL=https://bsod.nocclaro.com.br
BSOD_NOCCLARO_USER=...
BSOD_NOCCLARO_PASS=...
```

Senha com `#` / espaços: aspas no `.env`. Credenciais = portal CRM, **não** Xpertrak/LDAP.

Logs típicos:

| Mensagem                                     | Ação                                               |
| -------------------------------------------- | -------------------------------------------------- |
| `BSOD_NOCCLARO_USER / PASS não configurados` | preencher `.env` e reiniciar ciclo                 |
| `Login nocclaro rejeitado`                   | user/senha inválidos ou conta bloqueada no browser |
| `CRM sync OK uf=MA synced=N`                 | OK                                                 |

Teste de login:

```bash
cd /usr/local/empresarial/workers/bsod
venv/bin/python - <<'PY'
from lib.config import load_worker_env, get_nocclaro_config
from lib import nocclaro
load_worker_env()
cfg = get_nocclaro_config()
s = nocclaro._session()
nocclaro.login(s, cfg)
print("OK", cfg["user"])
PY
```

## Habilitar AM (MNS) / PA (BLM)

1. Preencher `BSOD_MNS_*` / `BSOD_BLM_*` no `.env` (Xpertrak MNS: `http://200.160.100.6/pathtrak/api`; LDAP MNS: `200.189.88.189,200.189.88.196`).
2. Preencher `ip` de cada CMTS em `config/cities/mns.json` ou `blm.json` (`vendor` + `pme_cidr` já cadastrados para MNS). **CASA:** DOCS-L2VPN-MIB + fallback `dot1qTpFdb`; validar com `scripts/snmp_probe_bsod.py --host IP --vendor CASA`.
3. `"enabled": true` no JSON (`uf` já é `AM` / `PA` para o CRM).
4. Testar: `venv/bin/python run_bsod_cycle.py --ope mns --force` (ou `blm`).

CRM só sync: `venv/bin/python run_bsod_crm_sync.py --ope sls` (ou `--dry-run`).

## VLAN na UI

| Label UI      | Coluna      | Origem                                                     |
| ------------- | ----------- | ---------------------------------------------------------- |
| **VLAN CMTS** | `bsod_vlan` | SNMP encap L2VPN no CMTS                                   |
| **CVLAN CRM** | `crm_cvlan` | `cvlan` do catálogo nocclaro após match (contrato ou VLAN) |

A coluna interna `vlan` guarda a VLAN CMTS normalizada (string) só para join/filtros; não é exibida como “operacional”.
PME só por faixa IP, sem L2VPN no CMTS, fica sem VLAN CMTS.

## Offline confirmado (PathTrak × CMTS × ping)

Migrations `026`–`027`: `cmts_reg_status`, `ping_reachable`.

| Fonte    | Coluna / campo        | Uso                                                          |
| -------- | --------------------- | ------------------------------------------------------------ |
| PathTrak | `bsod_monitor.status` | Última leitura SNMP PathTrak (0=offline, 1=online)           |
| CMTS     | `cmts_reg_status`     | Walk SNMP no ciclo de enrich                                 |
| Ping     | `ping_reachable`      | 3 ICMP no IP PME quando PathTrak offline e CMTS operational  |
| UI       | status efetivo        | CMTS prevalece; ping falho mantém offline (sem rótulo extra) |

Regra efetiva (interna, transparente na UI):

1. PathTrak online → online
2. PathTrak offline + CMTS ≠ operational → offline
3. PathTrak offline + CMTS operational + ping OK (ou sem IP / não testado) → online
4. PathTrak offline + CMTS operational + ping falhou 3× → offline

Env worker: `BSOD_PING_ATTEMPTS=3`, `BSOD_PING_TIMEOUT_SEC=2`, `BSOD_PING_PARALLEL=16`, `BSOD_PING_ENABLED=1`.

- Alarmes `/bsod` e KPI **Offline** usam status efetivo; o operador vê apenas online/offline.
- Tratativa BSOD só inicia para modem offline (status efetivo).
- Log do worker: `false_offline`, `ping_checked`, `ping_ok`, `ping_fail` (métricas internas).
- Sonda: `scripts/snmp_probe_bsod.py --host IP --vendor CASA` inclui walk de `docsIfCmtsCmStatusValue`.
