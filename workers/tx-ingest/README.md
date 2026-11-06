# TX ingest (potência óptica)

Worker Node que baixa o CSV do relatório GRB `relatorio_potencia_optica_tx.php`, filtra UFs **MA / AM / PA / AP** e faz upsert em `tx_optical_spans` (MySQL SIR).

Runbook: [docs/runbooks/tx-optical-ingest.md](../../docs/runbooks/tx-optical-ingest.md).

## Setup local

```bash
cd workers/tx-ingest
cp .env.example .env
# alinhar SIR_DB_* e GRB_TELNET_* com a raiz
npm install
# teste offline com o fixture:
TX_CSV_FILE=fixtures/potencia_optica_de_transmissao.csv node ingest.mjs
# ou ciclo real:
node ingest.mjs
```

Na raiz: `npm run env:check` e `npm run db:migrate`.

## Timer

```bash
sudo cp deploy/systemd/tx-ingest.service deploy/systemd/tx-ingest.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tx-ingest.timer
```
