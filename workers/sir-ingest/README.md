# SIR ingest

Workers que **gravam** no MySQL `sir` (RAL/REC via Playwright no SIR legado).

Não faz parte do Next.js — rode via systemd ou `npm run start:ral` / `start:rec`.

## Setup

```bash
cd workers/sir-ingest
cp .env.example .env
npm install
npm run install:browsers   # cria states/tmp + .playwright-browsers e instala Chromium
cd ../.. && npm run env:check
```

Credenciais MySQL via `SIR_DB_*` no `.env` (mesmas da raiz `.env.local`).

## Estrutura

```
sources/          AlertasRalRede.js / AlertasRecRede.js
sources/lib/      sir-scraper-common.js (Playwright + sessão)
states/           JSON de ciclo + tmp/ (runtime Playwright) + error/
telegram/         bot operacional + notify datacenter (HTTP → Next /api)
deploy/systemd/   units (logs → journal)
.playwright-browsers/   Chromium instalado (gitignored)
```

Schema MySQL: `npm run db:migrate` na raiz (tabelas vazias). **Em prod os dados vêm deste worker**, não de `db:import`.

Filtro SIR no select: **`REC/DSR/TCQ`** (não DSQ). Classificação REC/DSR/TCQ no frontend por prefixo de `num_recup`.

### Produção / lab

Runbook: [docs/runbooks/sir-ingest.md](../../docs/runbooks/sir-ingest.md) · install: [docs/runbooks/production-install.md](../../docs/runbooks/production-install.md) · lab: [docs/getting-started/development.md](../../docs/getting-started/development.md).

**Primeiro deploy:** `.env` com `SIR_DB_*` iguais ao `.env.local` + credenciais SIR + `npm ci`/`npm install` + `npm run install:browsers` (usuário da unit).

**Atualização:** se mudou este worker → deps aqui + restart RAL/REC (Next não precisa rebuild só por worker).

Os arquivos `states/*.json` guardam ciclo local (IDs vistos, encerramentos) e **não entram no git**. Em deploy novo o worker recria ao rodar; zerá-los só atrasa a detecção de “já visto” / encerramento até o próximo ciclo estável.

## Fluxo de coleta

Cada worker roda em loop com intervalo `INTERVALO_MONITORAMENTO` (default 5 min):

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ ensurePage  │────▶│ filtro RAL/REC   │────▶│ parse rows  │
│ (sessão)    │     │ + frames SIR     │     │ upsert MySQL│
└─────────────┘     └──────────────────┘     └─────────────┘
        │                                            │
        │ login só na 1ª vez ou após erro/timeout    ▼
        │                                     encerra ausentes
        └──────────────── SESSION_MAX_CYCLES ────────┘
```

Melhorias em relação ao fluxo anterior:

| Aspecto                   | Comportamento                                                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sessão reutilizada**    | Browser permanece aberto entre ciclos; login só na abertura, após erro ou a cada `SESSION_MAX_CYCLES` (default 12 ≈ 1h)                                                                        |
| **RAL vs REC deslocados** | REC inicia 90s depois do RAL (`CYCLE_OFFSET_MS=90000` na unit systemd) — evita dois logins simultâneos no SIR                                                                                  |
| **Temp fora de /tmp**     | Perfis Chromium em `states/tmp/`; binários em `.playwright-browsers/`                                                                                                                          |
| **Limpeza automática**    | Diretórios temp órfãos com mais de 24h são removidos na inicialização                                                                                                                          |
| **Encerramento**          | Registro some do SIR → após N ciclos vazios confirmados (`CICLOS_VAZIOS_PARA_ENCERRAR`, default 4), marca `ENCERRADO`. Vazio pós-login fresco e cliff populado→0 exigem confirmação reforçada. |
| **Overlap**               | Se um ciclo ainda estiver rodando, o próximo é ignorado (não empilha browsers)                                                                                                                 |
| **Retry**                 | Até 3 tentativas por ciclo; falha invalida sessão e reloga na próxima tentativa                                                                                                                |
| **Logs estruturados**     | Cada ciclo emite JSON `scrape_cycle` no journal (`active`, `rowErrors`, `durationMs`, `status`)                                                                                                |

### Monitorar

```bash
journalctl -u sir-ingest-ral -u sir-ingest-rec -f
journalctl -u sir-ingest-ral --since today | grep scrape_cycle
curl -s http://127.0.0.1:3003/api/saude | jq
curl -s http://127.0.0.1:3003/api/rals | jq '.status, .total_registros'
```

### Variáveis úteis

| Variável                      | Default                        | Efeito                                                                                                                   |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `INTERVALO_MONITORAMENTO`     | `300000` (5 min)               | Intervalo entre ciclos                                                                                                   |
| `CYCLE_OFFSET_MS`             | `0` (REC: `90000` via systemd) | Atraso antes do 1º ciclo                                                                                                 |
| `SESSION_MAX_CYCLES`          | `12`                           | Força relogin preventivo                                                                                                 |
| `CICLOS_VAZIOS_PARA_ENCERRAR` | `4`                            | Ciclos com tabela vazia antes de fechar todos (≥10 ativos anteriores: mínimo 5). Vazio logo após login fresco não conta. |
| `TMPDIR`                      | `states/tmp`                   | Perfil temp do Chromium                                                                                                  |
| `PLAYWRIGHT_BROWSERS_PATH`    | `.playwright-browsers`         | Binários do Playwright                                                                                                   |

## Execução

```bash
npm run start:ral
npm run start:rec
```

### Telegram (dois bots)

```bash
cd workers/sir-ingest/telegram
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python3 main-ops-bot.py
venv/bin/python3 notify-datacenter.py
```

| Processo               | Env                                                            | Função                                  |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------- |
| `main-ops-bot.py`      | `TELEGRAM_OPS_BOT_TOKEN`, `TELEGRAM_OPS_CHAT_ID`               | `/sir`, `/rotinas`; dashboard gerencial |
| `notify-datacenter.py` | `TELEGRAM_DATACENTER_BOT_TOKEN`, `TELEGRAM_DATACENTER_CHAT_ID` | Push RAL/REC CF datacenter              |

Dashboard gerencial (push periódico no grupo ops):

| Variável                             | Default             | Função                                         |
| ------------------------------------ | ------------------- | ---------------------------------------------- |
| `TELEGRAM_OPS_CHAT_ID`               | —                   | Chat/grupo de gerência (obrigatório para push) |
| `TELEGRAM_OPS_DASHBOARD_INTERVAL_MS` | `21600000` (6 h)    | Intervalo entre envios                         |
| `TELEGRAM_OPS_DASHBOARD_ENABLED`     | `true`              | `false` desliga o push                         |
| `TELEGRAM_OPS_DASHBOARD_TZ`          | `America/Sao_Paulo` | Fuso do carimbo de data/hora                   |

Conteúdo: PNG com resumo por estado e cidade, gráficos de barras por CF (todos) e legenda com totais; primeiro envio ~30 s após subir o bot.

Envio imediato (lab):

```bash
cd workers/sir-ingest
telegram/venv/bin/pip install -r telegram/requirements.txt
telegram/venv/bin/python3 telegram/send-management-dashboard.py
# só gerar PNG local:
telegram/venv/bin/python3 telegram/send-management-dashboard.py --dry-run
```

Simulacao de mensagens (sem alterar estado):

```bash
cd workers/sir-ingest
telegram/venv/bin/python3 telegram/simulate-datacenter-notify.py --dry-run
telegram/venv/bin/python3 telegram/simulate-datacenter-notify.py
```

Units prod: `deploy/systemd/sir-telegram-ops.service`, `sir-telegram-datacenter.service`.  
Units lab (`User=rcard`): `deploy/systemd/lab/sir-telegram-ops-lab.service`, `sir-telegram-datacenter-lab.service`.

Runbook: [docs/runbooks/telegram-bots.md](../../docs/runbooks/telegram-bots.md).
