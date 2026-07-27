---
name: emp-deploy-producao
description: >-
  Guides Debian production deploy for Empresarial GRNO using the project checklist.
  Use when the user asks to deploy to produção, atualizar produção, checklist de
  deploy, ordem de pull em prod, restart pós-deploy, or validate Next/SIR/Telegram
  after a release.
---

# Deploy produção (Empresarial GRNO)

## Fonte de verdade

Seguir **`docs/2026-07-26-deploy-producao.md`** na ordem das seções. Não inventar roteiro paralelo.

**Lab** (WSL / units `*-lab*` / `User=rcard`): usar **`docs/2026-07-27-lab.md`** — não aplicar o checklist de produção no lab.

Antes de systemd ou bots Telegram em **produção**: revisar **`docs/operacao-prod/README.md`** — aplicar entradas com **Prod: pendente** (comandos além do loop genérico).

## Sequência — release 2026-07-25/26 (prod pendente)

Ordem fixa (dependências entre entradas em `docs/operacao-prod/`):

| #   | Entrada                                                                            | Ação resumida                                            |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | [tratativas-migrations](../docs/operacao-prod/2026-07-26-tratativas-migrations.md) | `npm run db:migrate` (006–008)                           |
| 2   | [grb-critel-env](../docs/operacao-prod/2026-07-26-grb-critel-env.md)               | `.env.local` GRB/Critel + `npm run build` + restart Next |
| 3   | [telegram-sir-bots](../docs/operacao-prod/2026-07-26-telegram-sir-bots.md)         | venv, tokens worker `.env`, units, start bots            |

Após marcar cada entrada como **Prod: aplicado** no índice `docs/operacao-prod/README.md`.

## Fluxo genérico (agente)

1. Confirmar ambiente alvo (produção Debian `User=datacenter` vs lab `*-lab*` / `User=rcard`).
2. Lembrar backup opcional do schema SIR + `.env.local` / `workers/sir-ingest/.env` **antes** de mudar código.
3. Percorrer checklist:
   - `git pull origin main` na raiz
   - `npm install` (raiz)
   - **alinhar env** (skill `emp-align-env`) — `.env.local` + `workers/sir-ingest/.env`; `npm run env:check`
   - `npm run db:migrate` se `migrations/sir/` mudou
   - **`docs/operacao-prod/`** — pendências prod
   - `npm run build` + restart **`empresarial-next`**
   - ingest: `workers/sir-ingest/npm install` + restart **RAL/REC** se scrape mudou
   - telegram: `telegram/venv/bin/pip install -r requirements.txt` + restart **sir-telegram-ops** **sir-telegram-datacenter** se `telegram/` mudou
4. Restart (só se o usuário autorizar sudo/comandos):
   - prod: `empresarial-next`, `sir-ingest-ral`, `sir-ingest-rec`, `sir-telegram-ops`, `sir-telegram-datacenter`
   - lab: `empresarial-next-lab`, `sir-ingest-ral-lab`, `sir-ingest-rec-lab`, `sir-telegram-ops-lab`, `sir-telegram-datacenter-lab`
5. Validar:
   - `curl -s http://127.0.0.1:3003/api/saude | jq`
   - `curl -s http://127.0.0.1:3003/api/rals/contagem_por_cf | jq '.status'`
   - `journalctl -u sir-telegram-ops -u sir-telegram-datacenter -n 30`
   - dashboard dry-run: `workers/sir-ingest/telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run`

## Ordem de dependência (serviços)

```
env + db:migrate → build Next → restart empresarial-next → (ingest RAL/REC) → venv Telegram → start/restart bots
```

Bots Telegram **dependem** do Next na 3003; não subir `sir-telegram-*` antes de `api/saude` OK.

## Não fazer

- Copiar secrets do lab para produção.
- Commitar `.env.local` ou `workers/sir-ingest/.env`.
- `git pull` commit a commit em prod — um pull no `main` basta; ordem é operacional.
- Copiar units `*-lab*` em produção (ou units prod no lab).
- Pular entradas em `docs/operacao-prod/` quando a mudança exige venv, tokens ou units novas.
- `PYTHONPATH=.../telegram` nas units systemd.

## Referências

- Lab: `docs/2026-07-27-lab.md`
- Checklist produção: `docs/2026-07-26-deploy-producao.md`
- Units + troubleshooting: `deploy/README.md`
- Bots: `docs/2026-07-26-bots-telegram.md`
- Índice pendências: `docs/operacao-prod/README.md`
