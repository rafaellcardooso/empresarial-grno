---
name: emp-deploy-producao
description: >-
  Guides Debian production deploy for Empresarial GRNO using canonical runbooks.
  Use when the user asks to deploy to produção, atualizar produção, checklist de
  deploy, ordem de pull em prod, restart pós-deploy, or validate Next/SIR/Telegram/TMIP
  after a release.
---

# Deploy produção (Empresarial GRNO)

## Fonte de verdade

Seguir os runbooks — **não** inventar roteiro paralelo nem afirmar status Lab/Prod sem inventário:

| Situação            | Documento                               |
| ------------------- | --------------------------------------- |
| Host novo           | `docs/runbooks/production-install.md`   |
| Release             | `docs/runbooks/production-release.md`   |
| Estado desconhecido | `docs/runbooks/production-inventory.md` |
| Migrations          | `docs/runbooks/database-migrations.md`  |
| Rollback            | `docs/runbooks/rollback.md`             |
| Lab                 | `docs/getting-started/development.md`   |

## Fluxo do agente

1. Confirmar ambiente (prod `datacenter` vs lab `*-lab*` / `rcard`).
2. Se status do host for incerto → inventário primeiro.
3. Backup opcional de schema/env antes de DDL ou troca de secrets.
4. Release típico: `git pull` → `npm ci` → `env:check` se necessário → `db:migrate` se necessário → `build` → restart seletivo → smoke (`api/saude`, `.status`/`.total_registros` em `/api/rals`).
5. Ordem: env → DDL → build → Next OK → ingest/TMIP/BSOD → bots.
6. Não copiar secrets lab→prod; não misturar units lab/prod; não usar `db:import` em prod.
