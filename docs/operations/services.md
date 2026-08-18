# Serviços systemd

> Última revisão: **2026-08-18** · Índice: [../README.md](../README.md)

Inventário canônico das units. Instalação e restart: runbooks. Troubleshooting: [troubleshooting.md](troubleshooting.md).

## Produção (`User=datacenter`)

| Unit                         | Processo               | Efeito                               |
| ---------------------------- | ---------------------- | ------------------------------------ |
| `empresarial-next`           | `npm run start`        | Next 15 na **4001** (`/empresarial`) |
| `sir-ingest-ral`             | `AlertasRalRede.js`    | Grava `rals`                         |
| `sir-ingest-rec`             | `AlertasRecRede.js`    | Grava `recs` (offset 90s)            |
| `sir-telegram-ops`           | `main-ops-bot.py`      | Bot operacional + dashboard          |
| `sir-telegram-datacenter`    | `notify-datacenter.py` | Push CF datacenter                   |
| `tmip-ingest.timer`          | dispara oneshot        | SFTP → `sdh_alarms` a cada 10 min    |
| `bsod-ingest-xpertrak.timer` | dispara oneshot        | Xpertrak → cables/monitor (10 min)   |
| `bsod-ingest-snmp.timer`     | dispara oneshot        | SNMP VLAN/reg → inventário (10 min)  |
| `bsod-ingest-ldap.timer`     | dispara oneshot        | LDAP contrato/profile (3 h)          |
| `bsod-ingest-crm.timer`      | dispara oneshot        | nocclaro → `bsod_crm_clients` (6 h)  |

Arquivos:

- `deploy/systemd/empresarial-next.service`
- `workers/sir-ingest/deploy/systemd/sir-ingest-*.service`
- `workers/sir-ingest/deploy/systemd/sir-telegram-*.service`
- `workers/tmip/deploy/systemd/tmip-ingest.{service,timer}`
- `workers/bsod/deploy/systemd/bsod-ingest.service` (oneshot manual completo)
- `workers/bsod/deploy/systemd/bsod-ingest-{xpertrak,snmp,ldap,crm}.{service,timer}`

Checagem rápida no host:

```bash
/usr/local/empresarial/scripts/check-services.sh          # auto lab/prod
/usr/local/empresarial/scripts/check-services.sh --lab
```

`empresarial-next` exige `EnvironmentFile=/usr/local/empresarial/.env.local` (obrigatório — sem `-`).
A unit do repo define `HOSTNAME=0.0.0.0` e `PORT=4001` **depois** do `EnvironmentFile` (acesso direto `:4001` / pfSense).
Se o Node for via **nvm**, não sobrescreva a unit instalada com um `cp` cego: preserve `PATH` + `ExecStart` absolutos do npm do nvm.

## Lab (`User=rcard`)

| Unit                             | Diferença vs prod                   |
| -------------------------------- | ----------------------------------- |
| `empresarial-next-lab`           | `npm run dev`                       |
| `sir-ingest-*-lab`               | mesmo scrape, usuário lab           |
| `sir-telegram-*-lab`             | depende do Next lab                 |
| `tmip-ingest-lab.timer`          | mesmo ingest, usuário lab           |
| `bsod-ingest-xpertrak-lab.timer` | Xpertrak a cada 10 min, usuário lab |
| `bsod-ingest-snmp-lab.timer`     | SNMP a cada 10 min, usuário lab     |
| `bsod-ingest-ldap-lab.timer`     | LDAP a cada 3 h, usuário lab        |
| `bsod-ingest-crm-lab.timer`      | CRM a cada 6 h, usuário lab         |

Arquivos sob `deploy/systemd/lab/`, `workers/*/deploy/systemd/lab/`.

## Logs

```bash
sudo journalctl -u empresarial-next -f
sudo journalctl -u sir-ingest-ral -u sir-ingest-rec -f
sudo journalctl -u sir-telegram-ops -u sir-telegram-datacenter -f
sudo journalctl -u tmip-ingest -n 50 --no-pager
sudo journalctl -u 'bsod-ingest*' -n 50 --no-pager
sudo systemctl list-timers 'tmip-ingest*' 'bsod-ingest*'
```

No lab, acrescente o sufixo `-lab` aos nomes das units.
