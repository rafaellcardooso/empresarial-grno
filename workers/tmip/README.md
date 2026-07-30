# TMIP ingest (SDH)

Worker Python que baixa CSV via SFTP e faz upsert em `sdh_alarms` (MySQL SIR).

Deploy e timer: [docs/runbooks/tmip-sdh-ingest.md](../../docs/runbooks/tmip-sdh-ingest.md).

## Setup local

```bash
cd workers/tmip
cp .env.example .env
# SIR_DB_* iguais à raiz; SFTP_*; SFTP_MAX_AGE_HOURS
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python ingest_sdh.py
```

Na raiz: `npm run env:check`.

## Comportamento

- Filtra alarmes >6h conforme regras do script.
- Aborta se o arquivo remoto estiver velho (`SFTP_MAX_AGE_HOURS`) ou o CSV estiver vazio/malformado/com IDs duplicados — **sem** fechar o backlog em massa.
- Timer systemd a cada 10 min (`tmip-ingest.timer` / `tmip-ingest-lab.timer`).

## Estrutura

```
ingest_sdh.py
requirements.txt
.env.example
deploy/systemd/          # prod
deploy/systemd/lab/      # lab
dados/                   # runtime local (gitignored conforme projeto)
```
