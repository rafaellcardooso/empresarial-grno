# Modelo de deploy

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

Deploy oficial: **SSH manual + systemd**. Não há CI/CD de release neste repo.

## Ambientes

|                    | Lab                         | Produção                             |
| ------------------ | --------------------------- | ------------------------------------ |
| Usuário            | `rcard`                     | `datacenter`                         |
| Path               | `/usr/local/empresarial`    | `/usr/local/empresarial`             |
| Porta              | **3003**                    | **3003**                             |
| Next               | `npm run dev` (unit `-lab`) | `npm run build` + `npm run start`    |
| Dados SIR iniciais | `db:import` ok              | **Proibido** `db:import` — só ingest |
| Units              | sufixo `-lab`               | sem `-lab`                           |

Não misture units lab e prod no mesmo host.

## Ordem de dependência

```text
env alinhado → DDL (db:migrate) → npm ci + build Next
  → restart empresarial-next → api/saude OK
  → (ingest RAL/REC) → (tmip timer) → (bots Telegram)
```

Bots Telegram **dependem** do Next na 3003. Não subir `sir-telegram-*` antes de `api/saude` OK.

## Documentos

| Situação            | Runbook                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| Host novo           | [../runbooks/production-install.md](../runbooks/production-install.md)        |
| Release rotineiro   | [../runbooks/production-release.md](../runbooks/production-release.md)        |
| Estado desconhecido | [../runbooks/production-inventory.md](../runbooks/production-inventory.md)    |
| Migrations          | [../runbooks/database-migrations.md](../runbooks/database-migrations.md)      |
| Rollback            | [../runbooks/rollback.md](../runbooks/rollback.md)                            |
| Inventário de units | [../../deploy/README.md](../../deploy/README.md) · [services.md](services.md) |

## Padrões

- Produção: **`npm ci`** na raiz (não `npm install` solto — preserva lockfile). Manter **devDependencies** instaladas: o build usa TypeScript/`eslint-config-next`.
- Worker SIR: `npm ci` ou `npm install` em `workers/sir-ingest/` quando o lock/package mudar.
- Python: `venv/bin/pip install -r requirements.txt` quando requirements mudarem.
- Secrets: nunca copiar `.env` entre lab e prod; nunca commitar `.env.local` / workers `.env`.
