---
name: emp-db-setup
description: Subir MySQL SIR local, rodar migrations e seed de lab
---

# Setup banco SIR

Docs: `docs/getting-started/database.md` · migrations: `docs/runbooks/database-migrations.md`.

## 1. Env

```bash
cd /usr/local/empresarial
cp .env.example .env.local
npm run env:check
```

## 2. Lab

```bash
npm run db:bootstrap
npm run db:migrate
npm run db:import      # snapshot — NÃO use em prod
npm run db:seed-staff
```

Ou dados fake: `npm run db:setup` (`migrate` + `db:seed`).

Docker opcional: `docker-compose.dev.yml` (porta 3307) — ajustar `SIR_DB_PORT`.

## 3. Produção

```bash
node scripts/db/bootstrap-sir.mjs | sudo mariadb
npm run db:migrate
npm run db:seed-staff
```

**Proibido:** `db:import` / `db:seed`. Install completo: `docs/runbooks/production-install.md`.

## Troubleshooting

- `ERROR 1698`: `sudo mariadb`, não `-u root -p`.
- `ENOENT package.json`: comandos em `/usr/local/empresarial`.
- Env: `npm run env:check`.
