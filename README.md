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
npm run db:bootstrap          # WSL: cria DB + usuário (sudo mariadb)
npm run db:migrate && npm run db:import   # ou db:setup para dados fake
npm run env:check
```

Comandos úteis: `npm run db:migrate`, `npm run db:seed`, `npm run db:import`, `npm run db:bootstrap:sql`, `npm run env:check`.

### Produção — banco vazio + ingest (recomendado)

Em prod o banco **não vem do `.sql`**: cria-se o schema e os workers **RAL/REC** populam `rals` e `recs` a partir do SIR legado.

**Ordem no servidor:**

```bash
# 1) Env (raiz + worker com os mesmos SIR_DB_*)
cp .env.example .env.local
cd workers/sir-ingest && cp .env.example .env && cd ../..

# 2) Admin MySQL — cria claroEmpresarial + usuário monitor
npm run db:bootstrap:sql | mariadb -u root -p -h HOST_DO_MYSQL
# Se o app não for localhost no MySQL, ajuste antes:
#   SIR_DB_GRANT_HOSTS=localhost,127.0.0.1,IP_DO_APP

# 3) Tabelas vazias (rals, recs, schema_migrations)
npm run db:migrate

# 4) Validar paridade de credenciais raiz ↔ worker
npm run env:check

# 5) Ingest (Playwright grava no MySQL)
cd workers/sir-ingest
npm install && npm run install:browsers   # Chromium em .playwright-browsers/, temp em states/tmp/
cd ../..
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec

# 6) Next (somente leitura)
npm install && npm run build
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl enable --now empresarial-next
```

Após alguns ciclos do ingest (~5 min cada), confira:

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq length
```

> **Não use** `db:import` nem `db:seed` em prod se a carga vier do ingest.
> O worker faz `INSERT … ON DUPLICATE KEY UPDATE` e marca `ENCERRADO` quando o registro some do SIR.

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

Páginas: `/`, `/sir`, `/sir/rals`, `/sir/recs`, `/bsod`.

APIs (compatíveis com o Flask antigo para o bot):

| Rota                                        | Descrição         |
| ------------------------------------------- | ----------------- |
| `GET /api/rals`                             | RALs ativas       |
| `GET /api/recs`                             | RECs ativas       |
| `GET /api/rals/:num` / `GET /api/recs/:num` | Detalhe           |
| `GET /api/rals/contagem_por_cf`             | Contagem por CF   |
| `GET /api/bsod`                             | PME com BSOD VLAN |
| `GET /api/saude`                            | Ping SIR + HFC    |

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

Systemd (exemplo):

```bash
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sir-ingest-ral sir-ingest-rec
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
