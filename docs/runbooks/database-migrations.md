# Runbook — migrations SIR

> Última revisão: **2026-07-30** · Índice: [../README.md](../README.md)

DDL versionado em `migrations/sir/`. Aplicação: `npm run db:migrate` na raiz.

## Antes

1. Confirmar ambiente (lab vs prod) e backup.
2. Inventário: quais arquivos já estão em `schema_migrations` ([production-inventory.md](production-inventory.md)).
3. Janela: migrations com índice único / backfill podem falhar se houver dados inválidos.

### Backup (path gravável pelo operador)

```bash
# Exemplo — ajuste path e credenciais; NÃO use /root se o usuário não puder escrever lá
mkdir -p "$HOME/backups-empresarial"
mysqldump -h "$SIR_DB_HOST" -P "$SIR_DB_PORT" -u "$SIR_DB_USER" -p \
  --no-data "$SIR_DB_NAME" > "$HOME/backups-empresarial/sir-schema-$(date +%Y%m%d).sql"
# Para DDL arriscada, considere dump com dados das tabelas afetadas.
```

## Aplicar

```bash
cd /usr/local/empresarial
npm run db:migrate
```

Em Debian local: bootstrap inicial com `node scripts/db/bootstrap-sir.mjs | sudo mariadb` (ver install).

## Depois

1. Conferir `schema_migrations`.
2. `npm run build` + restart **`empresarial-next`** se a app depende do novo DDL.
3. Restart workers só se o worker lê/escreve colunas novas (ex.: TMIP após mudanças em `sdh_alarms`).

## Não fazer

- `db:import` / `db:seed` em produção.
- Assumir rollback automático de DDL — ver [rollback.md](rollback.md).
- Pular inventário quando o status de prod for desconhecido.
