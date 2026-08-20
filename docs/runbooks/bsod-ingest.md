# BSOD ingest (PME / BSoD)

> Última revisão: **2026-08-18**

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
sudo cp deploy/systemd/lab/bsod-ingest*.service deploy/systemd/lab/bsod-ingest*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl disable --now bsod-ingest-lab.timer 2>/dev/null || true
sudo systemctl enable --now \
  bsod-ingest-xpertrak-lab.timer bsod-ingest-snmp-lab.timer \
  bsod-ingest-ldap-lab.timer bsod-ingest-crm-lab.timer

# prod
# sudo cp deploy/systemd/bsod-ingest*.service deploy/systemd/bsod-ingest*.timer /etc/systemd/system/
# sudo systemctl daemon-reload
# sudo systemctl disable --now bsod-ingest.timer 2>/dev/null || true
# sudo systemctl enable --now \
#   bsod-ingest-xpertrak.timer bsod-ingest-snmp.timer \
#   bsod-ingest-ldap.timer bsod-ingest-crm.timer
```

Oneshot completo: `sudo systemctl start bsod-ingest.service` (lab: `bsod-ingest-lab.service`).  
Oneshot por fase: `bsod-ingest-xpertrak.service`, `bsod-ingest-snmp.service`, `bsod-ingest-ldap.service`, `bsod-ingest-crm.service`.

Após mudar timers no repo:

```bash
sudo cp workers/bsod/deploy/systemd/bsod-ingest*.service \
  workers/bsod/deploy/systemd/bsod-ingest*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl disable --now bsod-ingest.timer 2>/dev/null || true
sudo systemctl restart \
  bsod-ingest-xpertrak.timer bsod-ingest-snmp.timer \
  bsod-ingest-ldap.timer bsod-ingest-crm.timer
systemctl list-timers 'bsod-ingest*'
```

| Coleta        | Unit                         | Intervalo                |
| ------------- | ---------------------------- | ------------------------ |
| Xpertrak      | `bsod-ingest-xpertrak.timer` | **10 min** (boot +2 min) |
| SNMP VLAN/reg | `bsod-ingest-snmp.timer`     | **10 min** (boot +7 min) |
| LDAP          | `bsod-ingest-ldap.timer`     | **3 h** (boot +12 min)   |
| CRM nocclaro  | `bsod-ingest-crm.timer`      | **6 h** (boot +15 min)   |

O timer combinado `bsod-ingest.timer` foi removido. `bsod-ingest.service` permanece só para ciclo manual completo. CLI: `run_bsod_cycle.py --phase xpertrak|snmp|ldap|crm` (`enrich` = snmp+ldap).

## Persistência (update vs insert)

| Tabela                | Comportamento                                              |
| --------------------- | ---------------------------------------------------------- |
| `bsod_cables`         | **UPSERT** por `(ope, mac)`                                |
| `bsod_inventory`      | **UPSERT** por `(ope, mac)`; órfãos do ope são removidos   |
| `bsod_crm_clients`    | **replace** do ope (DELETE + INSERT da planilha ativa)     |
| `bsod_monitor`        | **INSERT** de nova amostra a cada ciclo (histórico RF)     |
| `bsod_monitor_latest` | **UPSERT** da última amostra por `(ope, mac)` (leitura UI) |

## Ciclo por cidade (`enabled: true`)

1. **CRM** (6 h) — login nocclaro → busca por `uf` do JSON → planilha → `bsod_crm_clients`
   - linhas `STATUS=CANCELADO` são descartadas
   - falha de CRM **não** aborta Xpertrak/SNMP/LDAP
2. **Xpertrak** (10 min) — nodes/modems → `bsod_cables` + amostras `bsod_monitor`
3. **SNMP** (10 min) — VLAN L2VPN + `cmts_reg_status` → inventário (preserva contrato/profile; remove órfãos)
4. **Ping PME** — 3 ICMP quando PathTrak offline + `ip_ger` → `ping_reachable` / `ping_checked_at`
5. **LDAP** (3 h) — contrato + profile → inventário; **produto** via `config/profiles.txt`
6. **Enrich CRM** no inventário (ordem):
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

Planilha local (`data/BSOD.xlsx`) — match por contrato em `bsod_inventory` e preenche **somente lacunas** de cliente, designação e VLAN:

```bash
venv/bin/python run_bsod_sheet_enrich.py --ope sls --dry-run
venv/bin/python run_bsod_sheet_enrich.py --ope sls
```

## VLAN na UI

| Label UI      | Coluna      | Origem                                                     |
| ------------- | ----------- | ---------------------------------------------------------- |
| **VLAN CMTS** | `bsod_vlan` | SNMP encap L2VPN no CMTS                                   |
| **CVLAN CRM** | `crm_cvlan` | `cvlan` do catálogo nocclaro após match (contrato ou VLAN) |

A coluna interna `vlan` guarda a VLAN CMTS normalizada (string) só para join/filtros; não é exibida como “operacional”.
PME só por faixa IP, sem L2VPN no CMTS, fica sem VLAN CMTS.

## Offline confirmado (PathTrak × CMTS)

Migrations `026`–`027`: `cmts_reg_status` (coleta no ciclo); `ping_reachable` permanece no schema (ping desligado por padrão).

| Fonte    | Coluna / campo        | Uso                                             |
| -------- | --------------------- | ----------------------------------------------- |
| PathTrak | `bsod_monitor.status` | Última leitura (0=offline, 1=online)            |
| CMTS     | `cmts_reg_status`     | SNMP docsIf3/docsIf (`8`=operational) no enrich |
| UI       | status efetivo        | CMTS desmente offline do PathTrak (sem rótulo)  |

Regra efetiva (interna, transparente na UI):

1. PathTrak online → online
2. PathTrak offline + CMTS operational (`8`) → online
3. PathTrak offline + CMTS ≠ operational (ou sem leitura) → offline

Env worker (CMTS reg): `BSOD_CMTS_REG_PARALLEL=2`, `BSOD_CMTS_REG_SNMP_TIMEOUT=15`, `BSOD_CMTS_REG_WALK_DEADLINE_SEC=180`, `BSOD_CMTS_REG_ALLOW_FULL_WALK=0`. Coleta via **cmPtr** + IF3 (preferido); `id_cable` Xpertrak ≠ índice SNMP no ARRIS/CASA.

Sonda antes do ciclo (no host com rede até os CMTS):

```bash
cd /usr/local/empresarial/workers/bsod
venv/bin/python scripts/snmp_probe_cmts_reg.py --ope mns --cmts MNSNSGCMT01 --from-db
venv/bin/python scripts/snmp_probe_cmts_reg.py --ope mns --cmts MNSNSGCMT02 --from-db
venv/bin/python scripts/snmp_probe_cmts_reg.py --ope mns --cmts MNSNSGCMT08 --from-db
```

- Alarmes `/bsod` e KPI **Offline** usam status efetivo; o operador vê apenas online/offline.
- Tratativa BSOD só inicia para modem offline (status efetivo).
- Log do worker: `false_offline`, `cmts_reg_maps` (métricas internas).
- UI: `lib/bsod/cmts-health.ts` (`deriveEffectiveMonitorStatus`).
- Sonda VLAN: `scripts/snmp_probe_bsod.py --host IP --vendor CASA`.
