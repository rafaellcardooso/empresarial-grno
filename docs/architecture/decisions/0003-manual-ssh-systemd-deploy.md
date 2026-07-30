# ADR 0003 — Deploy manual SSH + systemd

- **Status:** Aceito
- **Data:** 2026-07-30

## Contexto

Não há pipeline CI/CD de deploy neste monorepo. Operação usa servidor Linux com systemd.

## Decisão

- Modelo oficial: **SSH manual** + **systemd**.
- Fonte de procedimentos: runbooks em `docs/runbooks/` (install, release, migrations, rollback, inventário).
- Dependências de produção na raiz: `npm ci` (lockfile) **com** `devDependencies` disponíveis no host, porque `next build` usa TypeScript/ESLint do `devDependencies`.
- Estado de produção (migrations/units aplicadas) **não** é afirmado na documentação sem inventário no host.

## Consequências

- Skills Cursor apontam para os runbooks; não duplicam checklists datados.
- Notas em `docs/changes/deployment-notes/` são histórico, não instrução atual.
