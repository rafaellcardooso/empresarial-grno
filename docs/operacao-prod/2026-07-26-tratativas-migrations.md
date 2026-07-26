# Tratativas — migrations 006–008

> **Data:** 2026-07-26 · **Escopo:** lab + prod · **Lab:** aplicado · **Prod:** pendente

## Resumo

Workflow de tratativas BSOD/SIR (registro, acionamento, validação, conclusão) exige DDL em `migrations/sir/006`–`008`. Sem `db:migrate`, páginas `/sir`, `/bsod` e `/relatorios/tratativas` falham ao gravar ou listar tratativas.

## Impacto

| Item                            | Efeito se não aplicar             |
| ------------------------------- | --------------------------------- |
| `006_app_tratativas.sql`        | Tabela base inexistente           |
| `007_tratativa_acionamento.sql` | Acionamento de técnicos quebra    |
| `008_tratativa_workflow.sql`    | Validação / liberação quebra      |
| Next `app/api/tratativas/*`     | 500 em POST/GET                   |
| UI `components/tratativa/*`     | Erro ao abrir drawer de tratativa |

Serviços afetados: **`empresarial-next`** (após migrate, rebuild recomendado se código novo).

Ingest RAL/REC **não** depende destas migrations.

## Pré-requisitos

- Código atualizado (`git pull origin main`).
- `.env.local` com `SIR_DB_*` válidos.
- Backup opcional do schema SIR antes de DDL:

```bash
mysqldump -u monitor -p claroEmpresarial --no-data > /root/backup-sir-schema-$(date +%F).sql
```

---

## Passos — Lab

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run db:migrate
npm run build
sudo systemctl restart empresarial-next-lab   # ou npm run dev manual
```

Conferir migrations aplicadas:

```bash
npm run db:migrate   # deve reportar nada pendente
```

---

## Passos — Produção

```bash
cd /usr/local/empresarial
git pull origin main
npm install
npm run db:migrate
npm run build
sudo systemctl restart empresarial-next
```

Em Debian/Ubuntu, se bootstrap falhar com `ERROR 1698`, use `node scripts/db/bootstrap-sir.mjs | sudo mariadb` — ver [deploy/README.md](../../deploy/README.md).

---

## Validação

```bash
curl -s http://127.0.0.1:3003/api/saude | jq '.sir'
# UI autenticada: abrir tratativa em /sir/rals ou /bsod
# Relatório: /relatorios/tratativas
```

---

## Rollback

Migrations **não** revertem com `git checkout`. Se precisar desfazer DDL, restaurar backup manual ou avaliar DROP das tabelas criadas em 006–008 (risco de perda de dados de tratativas já gravadas).

---

## Referências

- [2026-07-26-operacao.md §9](../2026-07-26-operacao.md#9-tratativas-workflow-bsodsir)
- `migrations/sir/006_app_tratativas.sql` … `008_tratativa_workflow.sql`
