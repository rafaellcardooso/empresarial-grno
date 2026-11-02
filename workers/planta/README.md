# Planta sync

Worker Python que copia `db_planta.planta_instalada` (MySQL Terminal) para `tbl_planta_instalada` (MySQL SIR `claroEmpresarial`).

Deploy e timer: [docs/runbooks/planta-sync.md](../../docs/runbooks/planta-sync.md).

## Setup local

```bash
cd workers/planta
cp .env.example .env
# SIR_DB_* iguais à raiz; TERMINAL_DB_* da origem db_planta
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python sync_planta.py
```

Na raiz: `npm run env:check`. A tabela é criada pela migration `029_planta_instalada.sql` (`npm run db:migrate`).

## Comportamento

- Lê `designacao_circuito, razao_social, num_pta, cep_pta, velocidade, risco_multa, estacao_entrega_acesso, descr_acesso_ponta` de `planta_instalada`.
- Espelho completo: `DELETE` + `INSERT` em lotes numa única transação. Leitores veem o snapshot anterior até o commit; circuitos removidos na origem somem da tabela.
- Aborta sem alterar a tabela se a origem retornar 0 linhas ou qualquer etapa falhar (rollback).
- `designacao_circuito` não é chave única; o log informa quantas designações vieram repetidas.
- Valores com espaços nas pontas são aparados; texto vazio vira `NULL`.
- Timer systemd diário às 03:30 (`planta-sync.timer`).

## Estrutura

```
sync_planta.py
lib/config.py            # env (SIR_DB_*, TERMINAL_DB_*)
lib/source.py            # leitura da origem
lib/db.py                # substituição em tbl_planta_instalada
requirements.txt
.env.example
deploy/systemd/          # prod
deploy/systemd/lab/      # lab
```
