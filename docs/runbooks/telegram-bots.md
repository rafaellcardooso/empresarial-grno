# Runbook — bots Telegram SIR

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Bots em `workers/sir-ingest/telegram/`. Consomem HTTP do Next; **não** gravam MySQL.

## Mapa

| Processo                | Lab                           | Produção                  |
| ----------------------- | ----------------------------- | ------------------------- |
| Ops (`main-ops-bot.py`) | `sir-telegram-ops-lab`        | `sir-telegram-ops`        |
| Datacenter notify       | `sir-telegram-datacenter-lab` | `sir-telegram-datacenter` |

`WorkingDirectory=.../telegram`, `ExecStart=.../venv/bin/python3 <script>.py`.
**Não** defina `PYTHONPATH=.../telegram`.

## Variáveis (worker `.env`)

| Variável                                                        | Uso                                 |
| --------------------------------------------------------------- | ----------------------------------- |
| `TELEGRAM_OPS_BOT_TOKEN` / `TELEGRAM_OPS_CHAT_ID`               | Bot ops                             |
| `TELEGRAM_OPS_DASHBOARD_INTERVAL_MS`                            | Default 6 h                         |
| `TELEGRAM_DATACENTER_BOT_TOKEN` / `TELEGRAM_DATACENTER_CHAT_ID` | Notify                              |
| `EMPRESARIAL_API_URL`                                           | Default `http://127.0.0.1:4001/empresarial/api` |

| `SIR_DATACENTER_POLL_MS`                                        | Default 60 s                        |

## Produção

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt

cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-ops.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service /etc/systemd/system/
sudo systemctl daemon-reload
# Next deve estar saudável
sudo systemctl enable --now sir-telegram-ops sir-telegram-datacenter
```

## Lab

Copiar units de `workers/sir-ingest/deploy/systemd/lab/` e enable `*-lab`.

## Validação

```bash
sudo journalctl -u sir-telegram-ops -u sir-telegram-datacenter -n 40 --no-pager
cd /usr/local/empresarial/workers/sir-ingest
telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run
```
