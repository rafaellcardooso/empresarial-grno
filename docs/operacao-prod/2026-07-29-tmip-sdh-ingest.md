> **Data:** 2026-07-29 · **Escopo:** lab + prod · **Lab:** pendente · **Prod:** pendente

## Resumo

Ingestão TMIP da planilha SDH (`mais6HorasNorte.csv`) via SFTP a cada 10 minutos, tabela `sdh_alarms` (migration `009`) e página `/sdh`.

## Impacto

- Migrations `migrations/sir/009_sdh_alarms.sql`, `010_sdh_alarms_widen_text.sql`
  e `011_sdh_tratativa_events.sql`
- Worker `workers/tmip` (Python venv + `.env`)
- Units `tmip-ingest.timer` / `tmip-ingest-lab.timer`
- UI/nav: TMIP → SDH (`/sdh`; `/tmip` redireciona)
- Cronologia append-only de tratativa com observação, data e último login responsável

## Passos — Lab

```bash
cd /usr/local/empresarial
npm run db:migrate
cp workers/tmip/.env.example workers/tmip/.env
# alinhar SIR_DB_* com .env.local; preencher SFTP_*
python3 -m venv workers/tmip/venv
workers/tmip/venv/bin/pip install -r workers/tmip/requirements.txt
npm run env:check
workers/tmip/venv/bin/python workers/tmip/ingest_sdh.py

sudo cp workers/tmip/deploy/systemd/lab/tmip-ingest-lab.service /etc/systemd/system/
sudo cp workers/tmip/deploy/systemd/lab/tmip-ingest-lab.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tmip-ingest-lab.timer
```

## Passos — Produção

```bash
cd /usr/local/empresarial
git pull
npm run db:migrate
cp -n workers/tmip/.env.example workers/tmip/.env
# alinhar SIR_DB_* e SFTP_*
python3 -m venv workers/tmip/venv
workers/tmip/venv/bin/pip install -r workers/tmip/requirements.txt
npm run env:check
sudo cp workers/tmip/deploy/systemd/tmip-ingest.service /etc/systemd/system/
sudo cp workers/tmip/deploy/systemd/tmip-ingest.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tmip-ingest.timer
# rebuild/restart Next conforme checklist de release
```

## Validação

```bash
sudo systemctl list-timers 'tmip-ingest*'
sudo journalctl -u tmip-ingest-lab -n 50   # lab
curl -s 'http://127.0.0.1:3003/api/sdh' | head
# UI: http://localhost:3003/sdh
```
