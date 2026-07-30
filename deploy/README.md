# Deploy — units e troubleshooting

> Índice: [docs/README.md](../docs/README.md)

Este arquivo **não** é o checklist de instalação. Use:

| Ambiente         | Documento                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| **Lab**          | [docs/2026-07-27-lab.md](../docs/2026-07-27-lab.md)                         |
| **Produção**     | [docs/2026-07-26-deploy-producao.md](../docs/2026-07-26-deploy-producao.md) |
| **Delta manual** | [docs/operacao-prod/README.md](../docs/operacao-prod/README.md)             |

Aqui ficam: referência das **units systemd**, **troubleshooting** comum e lembretes de path.

Todos os comandos assumem:

```bash
cd /usr/local/empresarial
```

Rodar `npm` na home (`~`) ou como `root` em `/root` **falha** — não há `package.json` lá.

---

## Serviços systemd — produção

| Unit                      | Processo                  | Porta / efeito                             |
| ------------------------- | ------------------------- | ------------------------------------------ |
| `empresarial-next`        | `npm run start` → Next 15 | **3003** (leitura SIR + HFC)               |
| `sir-ingest-ral`          | `AlertasRalRede.js`       | Grava `rals`                               |
| `sir-ingest-rec`          | `AlertasRecRede.js`       | Grava `recs` (filtro SIR: **REC/DSR/TCQ**) |
| `sir-telegram-ops`        | `main-ops-bot.py`         | Bot operacional (`/sir`, `/rotinas`)       |
| `sir-telegram-datacenter` | `notify-datacenter.py`    | Push RAL/REC CF datacenter                 |
| `tmip-ingest.timer`       | `ingest_sdh.py` (oneshot) | SFTP → `sdh_alarms` a cada 10 min          |

Arquivos:

- `deploy/systemd/empresarial-next.service`
- `workers/sir-ingest/deploy/systemd/sir-ingest-ral.service`
- `workers/sir-ingest/deploy/systemd/sir-ingest-rec.service`
- `workers/sir-ingest/deploy/systemd/sir-telegram-ops.service`
- `workers/sir-ingest/deploy/systemd/sir-telegram-datacenter.service`
- `workers/tmip/deploy/systemd/tmip-ingest.service` + `tmip-ingest.timer`

Instalação e enable: checklist de [produção §6](../docs/2026-07-26-deploy-producao.md#6-systemd-uma-vez).

Logs:

```bash
sudo journalctl -u empresarial-next -f
sudo journalctl -u sir-ingest-ral -u sir-ingest-rec -f
sudo journalctl -u sir-telegram-ops -u sir-telegram-datacenter -f
```

---

## Serviços systemd — lab

Units com sufixo `-lab`, **`User=rcard`**, paths em `/usr/local/empresarial`.

| Unit                          | Processo               | Diferença vs prod                 |
| ----------------------------- | ---------------------- | --------------------------------- |
| `empresarial-next-lab`        | `npm run dev`          | Hot reload                        |
| `sir-ingest-ral-lab`          | `AlertasRalRede.js`    | Usuário `rcard`                   |
| `sir-ingest-rec-lab`          | `AlertasRecRede.js`    | Usuário `rcard`                   |
| `sir-telegram-ops-lab`        | `main-ops-bot.py`      | Depende de `empresarial-next-lab` |
| `sir-telegram-datacenter-lab` | `notify-datacenter.py` | Depende de Next + ingest lab      |
| `tmip-ingest-lab.timer`       | `ingest_sdh.py`        | SFTP → `sdh_alarms` a cada 10 min |

Arquivos em `deploy/systemd/lab/`, `workers/sir-ingest/deploy/systemd/lab/` e `workers/tmip/deploy/systemd/lab/`.

Setup completo (env, banco, enable): **[docs/2026-07-27-lab.md](../docs/2026-07-27-lab.md)**.

Instalação rápida das units:

```bash
cd /usr/local/empresarial
sudo cp deploy/systemd/lab/empresarial-next-lab.service /etc/systemd/system/
sudo cp workers/sir-ingest/deploy/systemd/lab/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now empresarial-next-lab sir-ingest-ral-lab sir-ingest-rec-lab
# Telegram: ver docs/operacao-prod/2026-07-26-telegram-sir-bots.md (Passos — Lab)
```

**Não** misturar units lab e prod no mesmo host (porta 3003 e `states/` do ingest).

---

## Troubleshooting (erros comuns)

| Sintoma                                           | Causa                        | Correção                                                                  |
| ------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `ENOENT … /root/package.json`                     | `npm` fora do repo           | `cd /usr/local/empresarial`                                               |
| `Cannot find package 'dotenv'`                    | Deps não instaladas          | `npm install` na raiz                                                     |
| `ERROR 1698 … root@localhost`                     | Auth socket do MariaDB       | `node scripts/db/bootstrap-sir.mjs \| sudo mariadb`                       |
| `ERROR 1064 … empresarial@0.1.0 db:bootstrap`     | Pipe de `npm run` no mariadb | Usar `node scripts/db/bootstrap-sir.mjs \| sudo mariadb`                  |
| `Executable doesn't exist … playwright-browsers`  | Chromium não baixado         | `workers/sir-ingest`: `npm run install:browsers` (usuário da unit)        |
| Next sobe mas UI antiga                           | Falta build após pull        | Prod: `npm run build && sudo systemctl restart empresarial-next`          |
| `api/saude` ERRO SIR                              | MySQL ou credenciais         | Conferir `.env.local`, `npm run env:check`, migrate                       |
| Worker `rowErrors` alto / encerramentos indevidos | Scrape incompleto            | Ver journal; após fix, restart workers; UPSERT reativa itens ainda no SIR |

Mais sintomas de UI/GRB: [docs/2026-07-26-operacao.md §14](../docs/2026-07-26-operacao.md#14-troubleshooting).

---

## UI SIR (atalho)

- `/sir` — resumo RAL e REC/DSR/TCQ
- `/sir/rals`, `/sir/recs` — filtros por tipo, CF, status e busca (`q`)
- APIs legado (bot): `/api/rals`, `/api/recs` (somente **ATIVO**) · BFF: `/api/sir/*`

Referência completa: [docs/2026-07-26-operacao.md](../docs/2026-07-26-operacao.md).
