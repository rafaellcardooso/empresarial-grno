# Getting started — banco SIR local

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

## Lab

```bash
cd /usr/local/empresarial
npm run db:bootstrap          # cria DB + usuário (sudo mariadb)
npm run db:migrate
npm run db:import             # snapshot dev — NÃO use em prod
npm run db:seed-staff         # STAFF interativo
```

Atalho migrate+seed fake: `npm run db:setup` (ainda assim **não** use seed fake em prod).

Em Debian/Ubuntu: `ERROR 1698` → use `sudo mariadb` no bootstrap.

## Produção

```bash
node scripts/db/bootstrap-sir.mjs | sudo mariadb   # se necessário
npm run db:migrate
npm run db:seed-staff
```

**Proibido:** `db:import`, `db:seed` (dados de desenvolvimento).

Procedimento completo de DDL: [../runbooks/database-migrations.md](../runbooks/database-migrations.md).

## Fonte de schema

Única fonte: arquivos em `migrations/sir/` + tabela `schema_migrations`. Dumps de backup não substituem migrations.
