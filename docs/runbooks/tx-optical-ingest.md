# TX ingest — potência óptica GRB

> Worker: `workers/tx-ingest` · Tabela: `tx_optical_spans` · Timer: 5 min

## O que faz

1. Autentica no GRB (Basic Auth `GRB_TELNET_*`).
2. Baixa o CSV via o mesmo GET do botão **Exportar em CSV**:
   `relatorio_potencia_optica_tx.php?id_rede=18&acao=consultar&exportar_csv=1&POTOPT_TX_V=-4;-2;0`.
3. Extrai UFs da coluna `DESIGNACAO` (texto entre `()`).
4. Mantém só spans que tocam **MA / AM / PA / AP** (`TX_REGION_UFS`).
5. UPSERT em `tx_optical_spans`; ausentes do scrape (na região) → `is_active=0`.

O host do worker precisa de rota até `200.255.253.12` (WSL sem rota para essa rede falha com timeout; use o Debian de produção ou um host Windows/VPN com acesso GRB).

## Pré-requisitos

```bash
npm run db:migrate
cd workers/tx-ingest && cp .env.example .env && npm install
# SIR_DB_* idêntico ao .env.local; GRB_TELNET_USERNAME/PASSWORD preenchidos
npm run env:check   # na raiz
```

## Teste offline

```bash
cd workers/tx-ingest
TX_CSV_FILE=fixtures/potencia_optica_de_transmissao.csv node ingest.mjs
```

## Produção

```bash
sudo cp workers/tx-ingest/deploy/systemd/tx-ingest.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tx-ingest.timer
journalctl -u tx-ingest.service -n 50 --no-pager
```

## UI

`/empresarial/tx` — listagem paginada dos enlaces ópticos ativos (filtro UF + busca), alimentada por `tx_optical_spans`.
