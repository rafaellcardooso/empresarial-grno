# Modelo de deploy

> Última revisão: **2026-08-11** · Índice: [../README.md](../README.md)

Deploy oficial: **SSH manual + systemd**. Não há CI/CD de release neste repo.

## Ambientes

|                    | Lab                         | Produção                             |
| ------------------ | --------------------------- | ------------------------------------ |
| Usuário            | `rcard`                     | `datacenter`                         |
| Path               | `/usr/local/empresarial`    | `/usr/local/empresarial`             |
| Porta Next         | **4001**                    | **4001**                             |
| Prefixo            | `/empresarial` (`basePath`) | `/empresarial` (Nginx → upstream)    |
| Next               | `npm run dev` (unit `-lab`) | `npm run build` + `npm run start`    |
| Dados SIR iniciais | `db:import` ok              | **Proibido** `db:import` — só ingest |
| Units              | sufixo `-lab`               | sem `-lab`                           |

Não misture units lab e prod no mesmo host.

## Nginx (portal)

Em produção o portal escuta na **80** e faz proxy de `/empresarial` para o Next em `127.0.0.1:4001`, **sem** strip do prefixo (o Next usa `basePath: "/empresarial"`).

```nginx
upstream empresarial {
    server 127.0.0.1:4001;
}

location = /empresarial {
    proxy_pass http://empresarial;
    # Host, X-Forwarded-*, Upgrade/Connection…
}

location /empresarial/ {
    proxy_pass http://empresarial;
    # mesmos headers
}
```

Smoke pelo portal: `http://<IP-portal>/empresarial/…`. Smoke local no host: `http://127.0.0.1:4001/empresarial/api/saude`.

## Ordem de dependência

```text
env alinhado → DDL (db:migrate) → npm ci + build Next
  → restart empresarial-next → api/saude OK
  → (ingest RAL/REC) → (tmip/bsod timers) → (bots Telegram)
```

Bots Telegram **dependem** do Next em `EMPRESARIAL_API_URL` (`http://127.0.0.1:4001/empresarial/api`). Não subir `sir-telegram-*` antes de `api/saude` OK.

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
