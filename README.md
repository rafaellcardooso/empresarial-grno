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
  deploy/
    README.md              # deploy produção (primeiro deploy + releases)
    systemd/
```

> Ideal a longo prazo: mover `workers/sir-ingest` para `/usr/local/sir-ingest` (requer root).

## Setup — banco SIR (dev local)

```bash
cp .env.example .env.local
npm run db:bootstrap          # WSL: cria DB + usuário (sudo mariadb)
npm run db:migrate && npm run db:import   # ou db:setup para dados fake
npm run env:check
```

Comandos úteis: `npm run db:migrate`, `npm run db:seed`, `npm run db:import`, `npm run db:bootstrap:sql`, `npm run env:check`.

## Deploy — produção

Guia completo: **[deploy/README.md](deploy/README.md)** (SRV-APP-DEV, usuário `datacenter`, porta **3003**).

### Atualização rotineira (após `git pull`)

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run build
sudo systemctl restart empresarial-next
# Se mudou workers/sir-ingest/:
cd workers/sir-ingest && npm install && cd ../..
sudo systemctl restart sir-ingest-ral sir-ingest-rec
```

### Primeiro deploy (resumo)

Em prod o banco **não vem do `.sql`**: schema vazio + workers **RAL/REC** populam `rals` e `recs`.

```bash
cd /usr/local/empresarial
git pull origin main
npm install

cp .env.example .env.local
cd workers/sir-ingest && cp .env.example .env && cd ../..
# Editar credenciais; depois: npm run env:check

# Banco — use sudo mariadb (não mariadb -u root -p) e pipe só o SQL:
node scripts/db/bootstrap-sir.mjs | sudo mariadb
npm run db:migrate
npm run db:seed-staff

cd workers/sir-ingest
npm install && npm run install:browsers
# Se Chromium faltar: sudo npx playwright install-deps chromium
cd ../..

sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec empresarial-next

npm run build
sudo systemctl restart empresarial-next
```

Conferência:

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
sudo journalctl -u sir-ingest-ral -n 20 --no-pager
```

> **Não use** `db:import` nem `db:seed` em prod se a carga vier do ingest.  
> Erros comuns (`ENOENT package.json`, `ERROR 1698`, pipe do bootstrap, Playwright): ver [deploy/README.md](deploy/README.md#troubleshooting-erros-comuns).

**Dev local** (com snapshot): `npm run db:migrate && npm run db:import` — só para desenvolvimento.

Skill detalhada: `.cursor/skills/emp-db-setup/SKILL.md`.

## Setup — Next

```bash
cd /usr/local/empresarial
cp .env.example .env.local   # após db:setup ou credenciais reais
npm install
npm run db:migrate
npm run db:seed-staff        # interativo — cria o único staff (senha não vai para .env)
npm run dev                  # http://localhost:3003
```

Login em `/login` com **matrícula corporativa** (ex.: `F104262`). Cadastros em `/cadastro` aguardam aprovação em `/admin/usuarios` (staff).

**Staff único:** rode `npm run db:seed-staff` uma vez após `db:migrate`. Se precisar trocar senha: `npm run db:seed-staff -- --reset-password`.

Páginas: `/`, `/sir`, `/sir/rals`, `/sir/recs`, `/bsod`. SIR: filtros por status (ativo/encerrado/todos), tipo e CF; ordenação por abertura.

APIs:

| Rota                                        | Descrição                  |
| ------------------------------------------- | -------------------------- |
| `GET /api/rals`                             | RALs ativas (bot Telegram) |
| `GET /api/recs`                             | RECs ativas (bot Telegram) |
| `GET /api/rals/:num` / `GET /api/recs/:num` | Detalhe                    |
| `GET /api/rals/contagem_por_cf`             | Contagem por CF            |
| `GET /api/sir/rals`, `/api/sir/recs`        | BFF com filtros (UI)       |
| `GET /api/bsod`                             | PME com BSOD VLAN          |
| `GET /api/saude`                            | Ping SIR + HFC             |

## Setup — ingest SIR

```bash
cd /usr/local/empresarial/workers/sir-ingest
cp .env.example .env
npm install
npm run install:browsers   # tmp + browsers fora de /tmp
cd ../.. && npm run env:check
npm run start:ral   # e/ou start:rec
```

Detalhes do fluxo de coleta (sessão, offset RAL/REC, monitoramento): `workers/sir-ingest/README.md`.

Credenciais MySQL: bloco `SIR_DB_*` no `.env` (igual ao `.env.local` da raiz).

Systemd — ver [deploy/README.md](../deploy/README.md):

```bash
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec empresarial-next
```

Bot Telegram: `python3 telegram/main-consultas-sir.py` (usa `TELEGRAM_BOT_TOKEN` e `EMPRESARIAL_API_URL`).

Flask legado removido — bot Telegram usa Next em `/api`.

## Formatação e qualidade

O projeto usa **Prettier** (formatação) e **ESLint** (regras). Configuração em `prettier.config.mjs` e `eslint.config.mjs`.

```bash
npm run format        # formata tudo
npm run format:check  # só verifica (falha se algo estiver fora do padrão)
npm run lint          # ESLint
npm run validate      # format:check + lint (roda no pre-push)
```

**Hooks Git (Husky):**

| Hook         | O que faz                                                          |
| ------------ | ------------------------------------------------------------------ |
| `pre-commit` | Prettier + ESLint nos arquivos staged (`lint-staged`)              |
| `commit-msg` | Valida mensagem (Conventional Commits)                             |
| `pre-push`   | `npm run validate` — bloqueia push se código não estiver formatado |

No Cursor/VS Code, abra a pasta do projeto e instale as extensões recomendadas (Prettier + ESLint). O `.vscode/settings.json` já ativa **format on save**.

## Regras

- **Empresarial** não escreve no MySQL do hfc-sls.
- **Scrapers** não rodam dentro do Next.
- Coleta BSOD continua no hfc-sls (`inventory_pme_enrich`).
