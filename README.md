# Empresarial GRNO

App **Next.js** (App Router) para monitoramento operacional: SIR (RAL/REC), BSOD, GRB (telnet + Critel), tratativas e relatórios.

A ingestão SIR (Playwright) fica em `workers/sir-ingest` — este app **lê** MySQL SIR e HFC; **grava** apenas tratativas no SIR.

## Objetivo

Centralizar em uma única interface:

- Listagens SIR (RAL/REC) com filtros, detalhes e workflow de tratativas
- Inventário BSOD/PME (leitura `hfc-sls`)
- Testes remotos **TELNET** via proxy GRB e gráficos **Critel** por designação
- Relatórios, export CSV e analytics de tratativas
- Autenticação corporativa (staff aprova cadastros)

## Stack

- Node.js 20+ · Next.js 15 (App Router)
- MySQL/MariaDB — SIR (`claroEmpresarial`) + leitura HFC (`hfc-sls`)
- Playwright — worker SIR (`workers/sir-ingest`)
- Bootstrap 5 · tema GRNO

## Setup rápido

```bash
cd /usr/local/empresarial
cp .env.example .env.local
npm run db:bootstrap
npm run db:migrate && npm run db:import   # dev; prod: ver deploy
npm run db:seed-staff
npm run env:check
npm install
npm run dev    # http://localhost:3003
```

## Lint / format (dev)

```bash
npm run format
npm run lint
npm run validate   # pre-push
```

Prettier + ESLint via **lint-staged** (pre-commit) e **commitlint** (Conventional Commits).

## Páginas principais

| Rota                             | Descrição                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `/sir`, `/sir/rals`, `/sir/recs` | RAL/REC e tratativas                                                            |
| `/bsod`                          | Inventário PME BSOD                                                             |
| `/grb`                           | TELNET GRB — Nokia (catálogo UF) ou Cisco IOS (hostname livre); ping para todos |
| `/grb/critel`                    | Gráficos Critel por designação                                                  |
| `/relatorios`                    | Hub de relatórios e export CSV                                                  |

Lista completa, APIs, env e troubleshooting: **[docs/](docs/README.md)** · **[operação](docs/2026-07-26-operacao.md)**

## Deploy (produção)

Checklist: **[docs/2026-07-26-deploy-producao.md](docs/2026-07-26-deploy-producao.md)** · runbook: **[deploy/README.md](deploy/README.md)** · **pendências lab/prod:** **[docs/operacao-prod/](docs/operacao-prod/README.md)**

```bash
cd /usr/local/empresarial
git pull origin main
npm install && npm run build
sudo systemctl restart empresarial-next
```

Porta **3003** · usuário típico **`datacenter`**.

## Worker SIR

```bash
cd workers/sir-ingest
cp .env.example .env
npm install && npm run install:browsers
npm run start:ral   # e/ou start:rec
```

Detalhes: [workers/sir-ingest/README.md](workers/sir-ingest/README.md)

## Systemd

```bash
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec empresarial-next
```

## Estrutura

```
empresarial/
  app/(shell)/       # páginas autenticadas
  app/api/           # BFF (SIR, BSOD, GRB, tratativas)
  components/        # UI React
  lib/               # queries, grb, critel, tratativa
  migrations/sir/
  workers/sir-ingest/
  docs/              # documentação
  deploy/            # systemd + runbook
```

## Regras

- Scrapers **não** rodam dentro do Next.
- Este repo **não escreve** no MySQL `hfc-sls`.
- Env: `.env.example` ↔ `.env.local` + `npm run env:check`.

Documentação completa: **[docs/README.md](docs/README.md)**
