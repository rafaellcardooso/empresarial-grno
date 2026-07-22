# Deploy — produção

Guia para servidor Linux (ex.: **SRV-APP-DEV**), repo em `/usr/local/empresarial`, usuário de serviço **`datacenter`**, app na porta **3003**.

Todos os comandos abaixo assumem:

```bash
cd /usr/local/empresarial
```

Rodar `npm` na home (`~`) ou como `root` em `/root` **falha** — não há `package.json` lá.

---

## Pré-requisitos

| Item                     | Notas                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Node.js 20+**          | `node -v` / `npm -v`                                                                                                  |
| **MariaDB/MySQL**        | Banco `claroEmpresarial`, usuário `monitor` (ou o de `.env.local`)                                                    |
| **Git**                  | Clone ou pull em `/usr/local/empresarial`                                                                             |
| **Usuário `datacenter`** | Dono do repo, units systemd e processos Playwright                                                                    |
| **Playwright (SO)**      | Após `install:browsers`, se o Chromium não subir: `sudo npx playwright install-deps chromium` em `workers/sir-ingest` |

Units systemd (copiar uma vez):

- `deploy/systemd/empresarial-next.service`
- `workers/sir-ingest/deploy/systemd/sir-ingest-ral.service`
- `workers/sir-ingest/deploy/systemd/sir-ingest-rec.service`

---

## Primeiro deploy (servidor novo)

### 1. Código e dependências Next

```bash
cd /usr/local/empresarial
git pull origin main          # ou git clone …
npm install
```

> `npm install` é **obrigatório antes** de `db:bootstrap:sql` — o script usa `dotenv` e outros pacotes da raiz.

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# Editar: SIR_DB_*, HFC_DB_*, AUTH_SECRET, APP_PUBLIC_URL (URL real do app)

cd workers/sir-ingest
cp .env.example .env
# Editar: SIR_DB_* (iguais à raiz), SISTEMA_USUARIO, SISTEMA_SENHA, SISTEMA_URL
cd ../..

npm run env:check
```

### 3. Banco SIR (schema vazio — dados vêm do ingest)

**Não** use `db:import` nem `db:seed` em produção.

Em Debian/Ubuntu o `root` do MariaDB costuma ser **socket-only** (`ERROR 1698`). Use **`sudo mariadb`**, não `mariadb -u root -p`.

**Não** pipeie `npm run …` direto no MariaDB — o npm imprime linhas de lifecycle no stdout e quebra o SQL. Use o script Node:

```bash
cd /usr/local/empresarial
node scripts/db/bootstrap-sir.mjs | sudo mariadb
npm run db:migrate
```

Se o MySQL não for localhost, ajuste `SIR_DB_GRANT_HOSTS` em `.env.local` antes do bootstrap (ex.: `localhost,127.0.0.1,IP_DO_APP`).

### 4. Login (staff)

```bash
npm run db:seed-staff
```

Cria o único usuário staff (matrícula + senha **só no banco**, não no `.env`).

### 5. Worker SIR (Playwright)

Como **`datacenter`** (mesmo usuário das units):

```bash
cd /usr/local/empresarial/workers/sir-ingest
npm install
export PLAYWRIGHT_BROWSERS_PATH=/usr/local/empresarial/workers/sir-ingest/.playwright-browsers
npm run install:browsers
```

Se o journal mostrar `Executable doesn't exist at …/.playwright-browsers/…`:

```bash
cd /usr/local/empresarial/workers/sir-ingest
sudo npx playwright install-deps chromium
npm run install:browsers
```

### 6. Systemd (uma vez)

```bash
cd /usr/local/empresarial
sudo cp workers/sir-ingest/deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sir-ingest-ral sir-ingest-rec empresarial-next
```

### 7. Build Next e subir serviços

```bash
cd /usr/local/empresarial
npm run build
sudo systemctl start sir-ingest-ral sir-ingest-rec empresarial-next
```

Ou: `sudo systemctl enable --now …` na primeira vez.

### 8. Conferir

Aguarde 1–2 ciclos do ingest (~5 min cada; REC inicia ~90s após RAL):

```bash
sudo systemctl status empresarial-next sir-ingest-ral sir-ingest-rec
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq length
curl -s http://127.0.0.1:3003/api/recs | jq length

sudo journalctl -u sir-ingest-ral -n 30 --no-pager
sudo journalctl -u sir-ingest-rec -n 30 --no-pager
```

Logs OK: `"status":"ok"` e `"rowErrors":0` no evento `scrape_cycle`.

---

## Atualização de release (deploy rotineiro)

Após `git pull`, **sempre** na raiz do repo:

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run build
sudo systemctl restart empresarial-next
```

| O que mudou no commit            | Ação extra                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Só `app/`, `components/`, `lib/` | Build + restart **Next** (acima)                                                                            |
| `workers/sir-ingest/`            | `cd workers/sir-ingest && npm install && cd ../..` + `sudo systemctl restart sir-ingest-ral sir-ingest-rec` |
| `migrations/sir/`                | `npm run db:migrate` (Next e workers podem continuar rodando)                                               |
| `.env.example` (novas chaves)    | Atualizar `.env.local` e `workers/sir-ingest/.env`; `npm run env:check`                                     |

**Atalho** (pull + build + restart dos 3 serviços):

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run build
(cd workers/sir-ingest && npm install)
sudo systemctl restart empresarial-next sir-ingest-ral sir-ingest-rec
```

Mudança **só no worker** → não precisa `npm run build`.  
Mudança **só na UI** → não precisa restart dos workers.

---

## Troubleshooting (erros comuns)

| Sintoma                                           | Causa                        | Correção                                                                            |
| ------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `ENOENT … /root/package.json`                     | `npm` fora do repo           | `cd /usr/local/empresarial`                                                         |
| `Cannot find package 'dotenv'`                    | Deps não instaladas          | `npm install` na raiz                                                               |
| `ERROR 1698 … root@localhost`                     | Auth socket do MariaDB       | `node scripts/db/bootstrap-sir.mjs \| sudo mariadb`                                 |
| `ERROR 1064 … empresarial@0.1.0 db:bootstrap`     | Pipe de `npm run` no mariadb | Usar `node scripts/db/bootstrap-sir.mjs \| sudo mariadb`                            |
| `Executable doesn't exist … playwright-browsers`  | Chromium não baixado         | `workers/sir-ingest`: `npm run install:browsers` como `datacenter`                  |
| Next sobe mas UI antiga                           | Falta build após pull        | `npm run build && sudo systemctl restart empresarial-next`                          |
| `api/saude` ERRO SIR                              | MySQL ou credenciais         | Conferir `.env.local`, `npm run env:check`, migrate                                 |
| Worker `rowErrors` alto / encerramentos indevidos | Scrape incompleto            | Ver journal; após fix de código, restart workers; UPSERT reativa itens ainda no SIR |

---

## Serviços systemd

| Unit               | Processo                  | Porta / efeito                             |
| ------------------ | ------------------------- | ------------------------------------------ |
| `empresarial-next` | `npm run start` → Next 15 | **3003** (leitura SIR + HFC)               |
| `sir-ingest-ral`   | `AlertasRalRede.js`       | Grava `rals`                               |
| `sir-ingest-rec`   | `AlertasRecRede.js`       | Grava `recs` (filtro SIR: **REC/DSR/TCQ**) |

Logs:

```bash
sudo journalctl -u empresarial-next -f
sudo journalctl -u sir-ingest-ral -u sir-ingest-rec -f
```

---

## UI SIR (referência)

- `/sir` — resumo; KPIs RAL e REC/DSR/TCQ (abertas / encerradas)
- `/sir/rals`, `/sir/recs` — filtros por tipo, CF e status (`?status=encerrado|todos`)
- Listagens ordenadas por **abertura** (mais antigas primeiro); clique no cabeçalho **ABERTURA** para inverter

APIs legado (bot Telegram): `/api/rals`, `/api/recs` (somente **ATIVO**). BFF interno: `/api/sir/*`.

---

## Dev local

Ver [README.md](../README.md) e skill `.cursor/skills/emp-db-setup/SKILL.md`. Em dev pode usar `db:import` com snapshot; **não** em prod.
