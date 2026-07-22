---
name: emp-align-env
description: Alinhar .env.example com .env.local (Next) e workers/sir-ingest/.env
---

# Alinhar env Empresarial

Rule: `.cursor/rules/emp-env.mdc`

## Pares

| Example (commit)                  | Local (gitignore)         |
| --------------------------------- | ------------------------- |
| `.env.example`                    | `.env.local`              |
| `workers/sir-ingest/.env.example` | `workers/sir-ingest/.env` |

MySQL SIR: **`SIR_DB_*` iguais** na raiz e no worker. Não usar `conexao-db.json`.

## Setup inicial

```bash
cd /usr/local/empresarial
cp .env.example .env.local

cd workers/sir-ingest
cp .env.example .env
# copiar SIR_DB_* do .env.local se necessário
cd ../.. && npm run env:check
```

## Ao alterar código

1. Nova variável → atualizar **example + local** (mesma ordem, bloco e comentários).
2. `SIR_DB_*` → replicar em `.env.local` **e** `workers/sir-ingest/.env`.
3. Validar: `npm run env:check`

## Cross-check

- `PORT=3002` ↔ `EMPRESARIAL_API_URL=http://127.0.0.1:3002/api`
- `SIR_DB_*` idêntico entre Next e worker

## Saúde

```bash
curl -s http://127.0.0.1:3002/api/saude | jq
```
