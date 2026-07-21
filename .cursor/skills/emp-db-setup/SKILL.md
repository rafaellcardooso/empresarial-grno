---
name: emp-db-setup
description: Subir MySQL SIR local, rodar migrations e seed de dev
---

# Setup banco SIR (dev)

## 1. Env

```bash
cd /usr/local/empresarial
cp .env.example .env.local
npm run env:check
```

Valores padrão dev (WSL MariaDB):

- `SIR_DB_HOST=127.0.0.1`
- `SIR_DB_PORT=3306`
- `SIR_DB_USER=monitor` (mesmo usuário do hfc-sls)
- `SIR_DB_PASSWORD=` igual ao `HFC_DB_PASSWORD`
- `SIR_DB_NAME=claroEmpresarial`

## 2. Banco local

### WSL + MariaDB (porta 3306)

MariaDB já instalado no WSL — sem Docker:

```bash
npm run db:bootstrap
```

`.env.local`: `SIR_DB_HOST=127.0.0.1`, `SIR_DB_PORT=3306`, user `monitor`, database `claroEmpresarial`.

### Docker (porta 3307)

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

Aguardar `healthy` no container `empresarial-mysql-sir`. Ajustar `SIR_DB_PORT=3307`.

## 3. Schema + dados

**Dev com dados fake:**

```bash
npm run db:migrate    # cria DB + tabelas + schema_migrations
npm run db:seed       # RAL/REC fake para UI
# ou
```bash
npm run db:setup      # migrate + seed
npm run env:check     # validar .env.example ↔ .env.local
```

**Dev com snapshot de produção** (`backup_sir_16052026.sql` na raiz ou em `data/backups/`):

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:import
# caminho customizado:
npm run db:import -- /caminho/para/backup.sql
```

O import restaura ~5.5k RALs e ~5.7k REC/DSRs. Só roda em `127.0.0.1`/`localhost` (use `--force` para remoto).

Dumps `backup_*.sql` estão no `.gitignore` — **não commitar**.

## 4. Verificar

```bash
curl -s http://127.0.0.1:3002/api/saude | jq
npm run dev
```

## Troubleshooting

- `ECONNREFUSED`: container parado ou `SIR_DB_PORT` errado.
- `Access denied`: credenciais `.env.local` ≠ `docker-compose.dev.yml` ou bootstrap MariaDB.
- Env desalinhado: `npm run env:check` — ver rule `emp-env`.
- Migration já aplicada: normal; `schema_migrations` controla idempotência.
