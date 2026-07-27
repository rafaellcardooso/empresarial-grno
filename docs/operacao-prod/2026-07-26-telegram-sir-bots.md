# Bots Telegram SIR + dashboard gerencial PNG

> **Data:** 2026-07-26 · **Escopo:** lab + prod · **Lab:** aplicado · **Prod:** aplicado

## Resumo

Dois bots novos em `workers/sir-ingest/telegram/` substituem o legado `main-consultas-sir.py`. Exigem **venv Python**, tokens no `.env` do worker, units systemd e **Next na 3003** respondendo `/api/rals`, `/api/recs`, `/api/saude`. O bot ops envia dashboard gerencial em PNG a cada 6 h (configurável).

## Impacto

| Processo               | Unit prod                 | Unit lab                      |
| ---------------------- | ------------------------- | ----------------------------- |
| `main-ops-bot.py`      | `sir-telegram-ops`        | `sir-telegram-ops-lab`        |
| `notify-datacenter.py` | `sir-telegram-datacenter` | `sir-telegram-datacenter-lab` |

Sem setup: nenhum bot SIR no Telegram; push datacenter inativo; dashboard PNG não enviado.

**Dependência:** `empresarial-next` deve estar no ar **antes** de subir os bots (`After=empresarial-next.service` nas units prod).

**Importante:** units **não** definem `PYTHONPATH` — conflita com pacote `python-telegram-bot`. Usar `WorkingDirectory=.../telegram` e `venv/bin/python3`.

## Pré-requisitos

- [GRB / Critel — env + build Next](2026-07-26-grb-critel-env.md) concluído (Next com query `contagem_por_cf` atualizada).
- Tokens Telegram (ops + datacenter) e IDs de chat/grupo.
- Código atualizado (`git pull origin main`).

Variáveis em `workers/sir-ingest/.env` (ver `.env.example`):

```dotenv
TELEGRAM_OPS_BOT_TOKEN=
TELEGRAM_OPS_CHAT_ID=
TELEGRAM_OPS_DASHBOARD_INTERVAL_MS=21600000
TELEGRAM_DATACENTER_BOT_TOKEN=
TELEGRAM_DATACENTER_CHAT_ID=
EMPRESARIAL_API_URL=http://127.0.0.1:3003/api
SIR_DATACENTER_POLL_MS=60000
```

```bash
cd /usr/local/empresarial && npm run env:check
```

---

## Passos — Lab (`User=rcard`)

```bash
cd /usr/local/empresarial
git pull origin main

# venv (primeira vez ou após mudança em requirements.txt)
cd workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# units lab (não copiar units prod)
cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/lab/sir-telegram-ops-lab.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/lab/sir-telegram-datacenter-lab.service /etc/systemd/system/
sudo systemctl daemon-reload

# Next lab deve estar ativo
sudo systemctl enable --now empresarial-next-lab sir-ingest-ral-lab sir-ingest-rec-lab
sudo systemctl enable --now sir-telegram-ops-lab sir-telegram-datacenter-lab
sudo systemctl restart sir-telegram-ops-lab sir-telegram-datacenter-lab
```

Teste dashboard sem enviar ao Telegram:

```bash
cd /usr/local/empresarial/workers/sir-ingest
telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run
```

Envio imediato ao grupo ops:

```bash
telegram/venv/bin/python3 telegram/send-management-dashboard.py
```

---

## Passos — Produção (`User=datacenter`)

```bash
cd /usr/local/empresarial
git pull origin main
npm install && npm run build
sudo systemctl restart empresarial-next

# venv
cd workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# units prod (sem sufixo -lab)
cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-ops.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sir-telegram-ops sir-telegram-datacenter
sudo systemctl start sir-telegram-ops sir-telegram-datacenter
```

**Atualização** (units já instaladas):

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
venv/bin/pip install -r requirements.txt
sudo systemctl restart sir-telegram-ops sir-telegram-datacenter
```

Desabilitar legado se ainda existir unit/script antigo apontando para `main-consultas-sir.py`.

---

## Validação

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals/contagem_por_cf | jq '.status'

sudo systemctl status sir-telegram-ops sir-telegram-datacenter
sudo journalctl -u sir-telegram-ops -u sir-telegram-datacenter -n 40 --no-pager
```

Telegram: `/sir` e teclado de rotinas no grupo ops; push datacenter ao abrir RAL/REC em CF monitorado.

Dashboard: primeiro PNG ~30 s após start do ops bot; intervalo default 6 h.

---

## Rollback

```bash
sudo systemctl disable --now sir-telegram-ops sir-telegram-datacenter
# ou units -lab no lab
sudo systemctl restart empresarial-next
```

Remover tokens do `.env` impede restart acidental com credenciais inválidas. Legado `main-consultas-sir.py` foi removido do repo — rollback de código exige `git checkout` de commit anterior.

---

## Referências

- [2026-07-26-bots-telegram.md](../2026-07-26-bots-telegram.md) — mapa bot → units
- [workers/sir-ingest/README.md](../../workers/sir-ingest/README.md) — env dashboard e simuladores
- [deploy/README.md](../../deploy/README.md) — systemd lab vs prod
