# Empresarial GRNO

App Next.js (App Router) para **exibir** dados do MySQL SIR (RAL/REC) e inventário **BSOD/PME** do hfc-sls.

A ingestão SIR (Playwright) fica em `workers/sir-ingest` — este app só lê bancos.

## Layout

```
empresarial/
  app/
    (shell)/                 # páginas com AppShell (/, /sir, /bsod, …)
    api/                     # Route Handlers (BFF)
  components/
    layout/                  # AppShell, Navbar, Sidebar
    ui/                      # PageHeader, DataTable, StatCard, …
  lib/
    config/                  # navigation.ts, ui-copy.ts
    db/                      # pools MySQL (SIR + HFC)
    models/                  # tipos RalRecord, RecRecord
    queries/
  migrations/sir/
  scripts/db/
  public/assets/             # tema Bootstrap GRNO (css, img, js)
  workers/sir-ingest/
  deploy/systemd/
```

> Ideal a longo prazo: mover `workers/sir-ingest` para `/usr/local/sir-ingest` (requer root).

## Setup — banco SIR (dev local)

```bash
cp .env.example .env.local
npm run db:bootstrap
npm run db:migrate && npm run db:import   # ou db:setup para dados fake
npm run env:check
```

Comandos úteis: `npm run db:migrate`, `npm run db:seed`, `npm run db:import`, `npm run env:check`.

Skill detalhada: `.cursor/skills/emp-db-setup/SKILL.md`.

## Setup — Next

```bash
cd /usr/local/empresarial
cp .env.example .env.local   # após db:setup ou credenciais reais
npm install
npm run dev                  # http://localhost:3002
```

Páginas: `/`, `/sir`, `/sir/rals`, `/sir/recs`, `/bsod`.

APIs (compatíveis com o Flask antigo para o bot):

| Rota | Descrição |
|------|-----------|
| `GET /api/rals` | RALs ativas |
| `GET /api/recs` | RECs ativas |
| `GET /api/rals/:num` / `GET /api/recs/:num` | Detalhe |
| `GET /api/rals/contagem_por_cf` | Contagem por CF |
| `GET /api/bsod` | PME com BSOD VLAN |
| `GET /api/saude` | Ping SIR + HFC |

## Setup — ingest SIR

```bash
cd /usr/local/empresarial/workers/sir-ingest
cp .env.example .env
npm install
npm run install:browsers
cd ../.. && npm run env:check
npm run start:ral   # e/ou start:rec
```

Credenciais MySQL: bloco `SIR_DB_*` no `.env` (igual ao `.env.local` da raiz).

Systemd (exemplo):

```bash
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec
```

Bot Telegram: `python3 telegram/main-consultas-sir.py` (usa `TELEGRAM_BOT_TOKEN` e `EMPRESARIAL_API_URL`).

Flask legado removido — bot Telegram usa Next em `/api`.

## Regras

- **Empresarial** não escreve no MySQL do hfc-sls.
- **Scrapers** não rodam dentro do Next.
- Coleta BSOD continua no hfc-sls (`inventory_pme_enrich`).
