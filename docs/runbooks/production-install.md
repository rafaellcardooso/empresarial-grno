# Runbook — instalação de produção

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Primeira instalação em host Debian/Linux. Usuário **`datacenter`**, path **`/usr/local/empresarial`**, porta **3003**.

Lab: [../getting-started/development.md](../getting-started/development.md). Release depois: [production-release.md](production-release.md).

**Não** use este roteiro no lab. **Não** copie secrets do lab.

---

## 1. Pré-requisitos

| Item                 | Notas                                               |
| -------------------- | --------------------------------------------------- |
| Node.js 20+          | `node -v` / `npm -v`                                |
| MariaDB/MySQL        | Banco SIR + leitura HFC                             |
| Git                  | Clone em `/usr/local/empresarial`                   |
| Usuário `datacenter` | Dono do repo, units e Playwright                    |
| Rede                 | GRB/Critel, portal SIR, SFTP TMIP, HFC conforme uso |

```bash
sudo mkdir -p /usr/local/empresarial
# clone como datacenter ou chown após clone
sudo chown -R datacenter:datacenter /usr/local/empresarial
cd /usr/local/empresarial
```

---

## 2. Código e dependências

```bash
cd /usr/local/empresarial
git pull origin main   # ou clone inicial
npm ci                 # lockfile; inclui devDependencies (necessárias ao build)
```

---

## 3. Variáveis de ambiente

```bash
cp .env.example .env.local
# Editar: SIR_DB_*, HFC_DB_*, AUTH_SECRET, APP_PUBLIC_URL
# GRB_BASE_URL, CRITEL_BASE_URL se usar TELNET/gráficos

cp workers/sir-ingest/.env.example workers/sir-ingest/.env
# Editar: SIR_DB_* (iguais à raiz), SISTEMA_*, tokens Telegram se for subir bots

cp workers/tmip/.env.example workers/tmip/.env
# Editar: SIR_DB_* (iguais), SFTP_*

npm run env:check
```

Detalhes: [../reference/configuration.md](../reference/configuration.md).

---

## 4. Banco SIR

**Não** rode `db:import` nem `db:seed` (dados fake) em produção.

```bash
cd /usr/local/empresarial
node scripts/db/bootstrap-sir.mjs | sudo mariadb   # se DB/user ainda não existem
npm run db:migrate
npm run db:seed-staff                              # interativo — cria STAFF
```

Em Debian/Ubuntu use **`sudo mariadb`** (`ERROR 1698` com `mariadb -u root -p`).

Backup antes de DDL futuras: [database-migrations.md](database-migrations.md).

---

## 5. Worker SIR (Playwright)

Como **`datacenter`**:

```bash
cd /usr/local/empresarial/workers/sir-ingest
npm ci   # ou npm install se não houver lock dedicado alinhado
export PLAYWRIGHT_BROWSERS_PATH=/usr/local/empresarial/workers/sir-ingest/.playwright-browsers
npm run install:browsers
```

Se faltar lib do SO: `sudo npx playwright install-deps chromium` neste diretório.

---

## 6. Worker TMIP

```bash
cd /usr/local/empresarial/workers/tmip
python3 -m venv venv
venv/bin/pip install -r requirements.txt
# conferir SFTP_* e SIR_DB_* no .env
venv/bin/python ingest_sdh.py   # smoke oneshot opcional
```

---

## 7. Telegram (venv)

```bash
cd /usr/local/empresarial/workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

Tokens em `workers/sir-ingest/.env` — ver [telegram-bots.md](telegram-bots.md).

---

## 8. Systemd (uma vez)

```bash
cd /usr/local/empresarial
sudo cp deploy/systemd/empresarial-next.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-ingest-ral.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-ingest-rec.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-ops.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service /etc/systemd/system/
sudo cp workers/tmip/deploy/systemd/tmip-ingest.service /etc/systemd/system/
sudo cp workers/tmip/deploy/systemd/tmip-ingest.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable empresarial-next sir-ingest-ral sir-ingest-rec \
  sir-telegram-ops sir-telegram-datacenter tmip-ingest.timer
```

Inventário: [../operations/services.md](../operations/services.md).

---

## 9. Build e start

```bash
cd /usr/local/empresarial
npm run build
sudo systemctl start empresarial-next
# aguardar api/saude OK
sudo systemctl start sir-ingest-ral sir-ingest-rec
sudo systemctl start tmip-ingest.timer
sudo systemctl start sir-telegram-ops sir-telegram-datacenter
```

Ordem: **Next saudável → ingest → TMIP → bots**.

---

## 10. Validação

```bash
sudo systemctl status empresarial-next sir-ingest-ral sir-ingest-rec \
  sir-telegram-ops sir-telegram-datacenter
sudo systemctl list-timers 'tmip-ingest*'

curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq '.status, .total_registros'
curl -s http://127.0.0.1:3003/api/rals/contagem_por_cf | jq '.status'

sudo journalctl -u sir-ingest-ral -n 30 --no-pager
sudo journalctl -u tmip-ingest -n 30 --no-pager
```

UI autenticada: `/sir`, `/bsod`, `/sdh`, `/grb`, `/relatorios`.

Dashboard Telegram (sem enviar):

```bash
cd /usr/local/empresarial/workers/sir-ingest
telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run
```

---

## Referências

- Release: [production-release.md](production-release.md)
- Inventário de host: [production-inventory.md](production-inventory.md)
- Rollback: [rollback.md](rollback.md)
