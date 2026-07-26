# Systemd — Bots Telegram SIR

> Última revisão: **2026-07-26** · Índice: [README.md](README.md) · App: [2026-07-26-operacao.md §12](2026-07-26-operacao.md#12-systemd-produção)

Bots em `workers/sir-ingest/telegram/`. Consomem HTTP do Next (`EMPRESARIAL_API_URL`); **não** gravam MySQL.

```
workers/sir-ingest/telegram/
├── main-ops-bot.py              # /sir, /rotinas, dashboard PNG agendado
├── notify-datacenter.py         # push RAL/REC CF datacenter
├── send-management-dashboard.py # envio manual / --dry-run
├── simulate-datacenter-notify.py
├── keyboards.py
├── functions/                   # handlers SIR e rotinas
└── lib/                         # API, contagem, PNG, mensagens
```

Units em `workers/sir-ingest/deploy/systemd/` (prod) e `deploy/systemd/lab/` (lab).

## Mapa processo → units (lab / produção)

| Sufixo             | Ambiente          | `User=`      |
| ------------------ | ----------------- | ------------ |
| Nome contém `-lab` | Lab (WSL / dev)   | `rcard`      |
| Sem `-lab`         | Produção (Debian) | `datacenter` |

**Não** copie units de produção no lab (paths e permissões diferem).

| Processo          | Lab                           | Produção                  |
| ----------------- | ----------------------------- | ------------------------- |
| Bot operacional   | `sir-telegram-ops-lab`        | `sir-telegram-ops`        |
| Notify datacenter | `sir-telegram-datacenter-lab` | `sir-telegram-datacenter` |

Dependência systemd (prod): `After=empresarial-next.service` — subir Next antes dos bots.

### venv e WorkingDirectory

Todas as units usam:

- `WorkingDirectory=/usr/local/empresarial/workers/sir-ingest/telegram`
- `EnvironmentFile=/usr/local/empresarial/workers/sir-ingest/.env`
- `ExecStart=.../telegram/venv/bin/python3 <script>.py`

**Não** adicionar `PYTHONPATH=.../telegram` — causa `ModuleNotFoundError` com `python-telegram-bot`.

## Variáveis (worker `.env`)

| Variável                             | Bot        | Função                                |
| ------------------------------------ | ---------- | ------------------------------------- |
| `TELEGRAM_OPS_BOT_TOKEN`             | ops        | Token BotFather                       |
| `TELEGRAM_OPS_CHAT_ID`               | ops        | Grupo gerência (dashboard + comandos) |
| `TELEGRAM_OPS_DASHBOARD_INTERVAL_MS` | ops        | Default `21600000` (6 h)              |
| `TELEGRAM_OPS_DASHBOARD_ENABLED`     | ops        | Default `true`                        |
| `TELEGRAM_DATACENTER_BOT_TOKEN`      | datacenter | Token separado                        |
| `TELEGRAM_DATACENTER_CHAT_ID`        | datacenter | Grupo datacenter                      |
| `EMPRESARIAL_API_URL`                | ambos      | Default `http://127.0.0.1:3003/api`   |
| `SIR_DATACENTER_POLL_MS`             | datacenter | Default `60000`                       |

Paridade: `workers/sir-ingest/.env.example` ↔ `.env` · `npm run env:check` na raiz.

## Instalação — lab

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt

cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/lab/sir-telegram-ops-lab.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/lab/sir-telegram-datacenter-lab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-telegram-ops-lab sir-telegram-datacenter-lab
```

## Instalação — produção

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt

cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-ops.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-telegram-ops sir-telegram-datacenter
```

Roteiro completo (primeira vez em prod): [operacao-prod/2026-07-26-telegram-sir-bots.md](operacao-prod/2026-07-26-telegram-sir-bots.md).

## Dashboard gerencial (PNG)

Agendado no `main-ops-bot.py` via JobQueue (`python-telegram-bot[job-queue]`).

Conteúdo: totais RAL/REC, tabelas por UF e cidade, barras horizontais por CF (todos). Caption com totais e tipos REC.

```bash
cd /usr/local/empresarial/workers/sir-ingest
telegram/venv/bin/python3 telegram/send-management-dashboard.py          # envia agora
telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run # só PNG local
```

## Logs e diagnóstico

```bash
journalctl -u sir-telegram-ops-lab -u sir-telegram-datacenter-lab -f   # lab
journalctl -u sir-telegram-ops -u sir-telegram-datacenter -f             # prod
```

Simular notify datacenter sem estado:

```bash
cd workers/sir-ingest
telegram/venv/bin/python3 telegram/simulate-datacenter-notify.py --dry-run
```

## Legado removido

`main-consultas-sir.py` foi substituído por `main-ops-bot.py` + `notify-datacenter.py`. Units antigas com esse script devem ser desabilitadas manualmente no host.

## Ações manuais pendentes

Índice lab/prod: [operacao-prod/README.md](operacao-prod/README.md).
