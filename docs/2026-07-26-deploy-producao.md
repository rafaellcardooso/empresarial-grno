# Deploy em produção — Empresarial GRNO

> Última revisão: **2026-07-26** · Índice: [README.md](README.md)

Checklist para servidor Linux (ex.: **SRV-APP-DEV**), repo em `/usr/local/empresarial`, usuário **`datacenter`**, app na porta **3003**.

Runbook completo, tabela de troubleshooting e referência de serviços: **[deploy/README.md](../deploy/README.md)**.

**Antes do passo 6 (systemd) ou de subir bots Telegram:** consulte **[operacao-prod/README.md](operacao-prod/README.md)** — entradas com **Prod: pendente** têm comandos extras (migrations 006–008, env GRB, venv Python, units `sir-telegram-*`) além do loop genérico abaixo.

---

## 1. Pré-requisitos

| Item                     | Notas                                                          |
| ------------------------ | -------------------------------------------------------------- |
| **Node.js 20+**          | `node -v` / `npm -v`                                           |
| **MariaDB/MySQL**        | Banco `claroEmpresarial` (SIR) + leitura `hfc-sls` (BSOD)      |
| **Git**                  | Clone ou pull em `/usr/local/empresarial`                      |
| **Usuário `datacenter`** | Dono do repo, units systemd e Playwright                       |
| **Rede interna GRB**     | App precisa alcançar `GRB_BASE_URL` e `CRITEL_BASE_URL` (HTTP) |
| **Playwright (SO)**      | Worker SIR; ver §5 e [deploy/README.md](../deploy/README.md)   |

---

## 2. Código e dependências

```bash
cd /usr/local/empresarial
git pull origin main
npm install
```

> `npm install` na raiz é **obrigatório** antes de scripts que usam `dotenv` (`bootstrap-sir`, `env:check`).

---

## 3. Variáveis de ambiente

```bash
cp .env.example .env.local
# Editar: SIR_DB_*, HFC_DB_*, AUTH_SECRET, APP_PUBLIC_URL
# GRB_BASE_URL, CRITEL_BASE_URL (rede interna)

cd workers/sir-ingest
cp .env.example .env
# Editar: SIR_DB_* (iguais à raiz), SISTEMA_USUARIO, SISTEMA_SENHA, SISTEMA_URL
cd ../..

npm run env:check
```

Blocos novos ou críticos desde 2026-07-26:

```dotenv
GRB_BASE_URL=http://200.255.253.12/grb/topologia_rede/www
CRITEL_BASE_URL=http://200.255.253.12/grb/critel
```

Lista completa e regras de paridade: [2026-07-26-operacao.md §4](2026-07-26-operacao.md#4-variáveis-de-ambiente) · `.env.example`.

---

## 4. Banco SIR (schema + migrations)

**Não** use `db:import` nem `db:seed` em produção — dados vêm do ingest RAL/REC.

```bash
cd /usr/local/empresarial
node scripts/db/bootstrap-sir.mjs | sudo mariadb
npm run db:migrate
npm run db:seed-staff
```

Migrations de tratativas (`006`–`008`) rodam com `db:migrate` — necessárias para workflow BSOD/SIR.

Em Debian/Ubuntu use **`sudo mariadb`**, não `mariadb -u root -p` (`ERROR 1698`).

---

## 5. Worker SIR (Playwright)

Como **`datacenter`**:

```bash
cd /usr/local/empresarial/workers/sir-ingest
npm install
export PLAYWRIGHT_BROWSERS_PATH=/usr/local/empresarial/workers/sir-ingest/.playwright-browsers
npm run install:browsers
```

Se Chromium faltar: `sudo npx playwright install-deps chromium` neste diretório.

---

## 6. Systemd (uma vez)

Ingest + Next:

```bash
cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/sir-ingest-ral.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-ingest-rec.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sir-ingest-ral sir-ingest-rec empresarial-next
```

Telegram (venv + tokens antes — roteiro completo): [operacao-prod/2026-07-26-telegram-sir-bots.md](operacao-prod/2026-07-26-telegram-sir-bots.md).

```bash
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-ops.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sir-telegram-ops sir-telegram-datacenter
```

---

## 7. Build e subir serviços

```bash
cd /usr/local/empresarial
npm run build
sudo systemctl start sir-ingest-ral sir-ingest-rec empresarial-next
```

---

## 8. Validação

Aguarde 1–2 ciclos do ingest (~5 min; REC ~90s após RAL):

```bash
sudo systemctl status empresarial-next sir-ingest-ral sir-ingest-rec
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq length

sudo journalctl -u sir-ingest-ral -n 30 --no-pager
```

UI (autenticado): `/sir`, `/bsod`, `/grb` (TELNET), `/grb/critel`, `/relatorios`.

---

## 9. Atualização rotineira (release)

**Release 2026-07-25/26 (primeira vez em prod):** seguir a ordem em [operacao-prod/README.md](operacao-prod/README.md#ordem-sugerida--release-2026-07-2526-prod-pendente) (migrations → GRB env + build → Telegram).

Loop genérico após delta manual aplicado:

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run build
sudo systemctl restart empresarial-next
```

| O que mudou                      | Ação extra                                                              |
| -------------------------------- | ----------------------------------------------------------------------- |
| Só `app/`, `components/`, `lib/` | Build + restart **Next**                                                |
| `workers/sir-ingest/` (scrape)   | `cd workers/sir-ingest && npm install` + restart **RAL/REC**            |
| `workers/sir-ingest/telegram/`   | `venv/bin/pip install -r requirements.txt` + restart **sir-telegram-*** |
| `migrations/sir/`                | `npm run db:migrate`                                                    |
| `.env.example` (novas chaves)    | Atualizar `.env.local` e `workers/sir-ingest/.env`; `npm run env:check` |

Atalho (pull + build + restart Next + ingest):

```bash
cd /usr/local/empresarial
git pull origin main && npm install && npm run build
(cd workers/sir-ingest && npm install)
sudo systemctl restart empresarial-next sir-ingest-ral sir-ingest-rec
```

Telegram (se mudou `telegram/` ou `requirements.txt`):

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
venv/bin/pip install -r requirements.txt
sudo systemctl restart sir-telegram-ops sir-telegram-datacenter
```

---

## 10. Rollback

```bash
cd /usr/local/empresarial
git checkout <commit-anterior>
npm install && npm run build
sudo systemctl restart empresarial-next sir-ingest-ral sir-ingest-rec
```

Migrations já aplicadas **não** revertem automaticamente — avaliar manualmente se o rollback incluir DDL.

---

## 11. Referências

- **Pendências lab/prod:** [operacao-prod/README.md](operacao-prod/README.md)
- Bots Telegram SIR: [2026-07-26-bots-telegram.md](2026-07-26-bots-telegram.md)
- Troubleshooting detalhado: [deploy/README.md](../deploy/README.md#troubleshooting-erros-comuns)
- Operação diária e APIs: [2026-07-26-operacao.md](2026-07-26-operacao.md)
- Skill de banco dev: `.cursor/skills/emp-db-setup/SKILL.md`
