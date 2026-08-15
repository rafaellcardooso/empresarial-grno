# Plano: monitoramento externo (Zabbix) → Empresarial SIR

> Status: **rascunho aprovado para evolução** · Data: **2026-08-14**  
> Domínios: **BSOD (HFC/DOCSIS)** agora · **GPON** na mesma arquitetura depois  
> Relacionado: [../architecture/data-and-write-boundaries.md](../architecture/data-and-write-boundaries.md) · [../runbooks/bsod-ingest.md](../runbooks/bsod-ingest.md)

## Objetivo

Introduzir um **Zabbix proxy** (perto da rede de gestão) para monitorar CPE/OLT/CMTS com ICMP/SNMP, e integrar o resultado ao app Empresarial sem violar as fronteiras de escrita:

- Zabbix **monitora**
- Worker **grava** no MySQL SIR
- Next.js **só lê** (UI, alarmes, tratativas)

O mesmo contrato serve **BSOD** e, no futuro, **GPON** (ONT/OLT), trocando apenas o catálogo de inventário e os templates Zabbix.

## Problema que resolve

| Situação atual (BSOD)                    | Limitação                                                         |
| ---------------------------------------- | ----------------------------------------------------------------- |
| PathTrak + SNMP reg no CMTS no `web-app` | Bom para status de registro; ICMP ao CPE falha (host sem rota L3) |
| Ping no ciclo                            | Desligado (`BSOD_PING_ENABLED=0`) — ingest não alcança CPE        |
| UI                                       | Status efetivo = PathTrak × `cmts_reg_status`                     |

Com proxy na rede correta: ICMP/SNMP ao CPE volta a ser viável; o app continua na DMZ/servidor de aplicação.

## Princípios

1. **Uma chave de correlação:** `ope` + MAC normalizado (BSOD) / `ope` + serial ou `ont_id` (GPON) — documentar por domínio.
2. **Inventário master no SIR** (ou worker de domínio); Zabbix não é master de CRM/contrato.
3. **Next não chama Zabbix API** em page load.
4. **Zabbix não escreve MySQL** do Empresarial.
5. **Templates Zabbix versionados** fora do app (repo ops ou pasta `deploy/zabbix/`), referenciados neste plano.
6. **Fase híbrida** antes de substituir a fonte de saúde atual.

## Papéis

```text
CPE / CMTS / OLT  ──ICMP/SNMP──►  Zabbix proxy  ──►  Zabbix server
                                      │
                                      ▼  webhook / API history
                               workers/<domínio>
                                      │
                                      ▼  UPSERT SIR
                         inventário + amostras de saúde
                                      │
                                      ▼  SELECT
                               Next (alarmes / KPI / tratativa)
```

| Componente                             | Responsabilidade                                     |
| -------------------------------------- | ---------------------------------------------------- |
| Zabbix proxy                           | Coleta na rede de acesso/gestão                      |
| Zabbix server                          | Triggers, histórico, LLD, webhooks                   |
| Worker domínio (`bsod`, futuro `gpon`) | LLD feed (opcional) + ingest de eventos/status → SIR |
| Next BFF                               | APIs autenticadas de inventário (LLD) e UI           |

## Modelo de dados (SIR)

Abstração comum (nomes ilustrativos; migrations numeradas na hora de implementar):

| Conceito              | BSOD (hoje / evolução)                                  | GPON (futuro)        |
| --------------------- | ------------------------------------------------------- | -------------------- |
| Inventário            | `bsod_inventory`                                        | ex. `gpon_inventory` |
| Amostra RF / óptica   | `bsod_monitor`                                          | ex. `gpon_monitor`   |
| Status externo Zabbix | colunas em inventário **ou** tabela `*_external_health` | idem                 |
| Tratativa             | `app_tratativas` (já compartilhada)                     | mesmo fluxo FCA      |

Colunas sugeridas na saúde externa (por domínio ou tabela genérica `ext_monitor_samples`):

| Campo           | Tipo         | Uso                                        |
| --------------- | ------------ | ------------------------------------------ |
| `ope`           | varchar      | Operação / cidade                          |
| `device_key`    | varchar      | MAC (BSOD) ou serial/ONT id (GPON)         |
| `source`        | enum/varchar | `zabbix` \| `pathtrak` \| `cmts_snmp` \| … |
| `avail_status`  | tinyint      | 0 offline / 1 online (normalizado)         |
| `raw_status`    | varchar/json | Valor bruto (SNMP, trigger, severity)      |
| `zabbix_hostid` | bigint null  | Deep-link opcional                         |
| `checked_at`    | datetime     | Última observação                          |

**Status efetivo na UI** (função por domínio, espelho de `lib/bsod/cmts-health.ts`):

1. Fonte primária online → online
2. Primária offline + Zabbix/CMTS operational → online (falso offline)
3. Caso contrário → offline

Regra exata por domínio fica em ADR quando estabilizar.

## Integração Zabbix

### A) Low-Level Discovery (LLD)

- Endpoint BFF **read-only**, token de serviço (não cookie de usuário):  
  `GET /empresarial/api/internal/zabbix/lld?domain=bsod&ope=mns`  
  (GPON: `domain=gpon`)
- Resposta: lista `{ device_key, cmts_or_olt, ip?, tags[] }` a partir do inventário SIR.
- Zabbix cria hosts/itens a partir do LLD (template BSOD vs template GPON).

### B) Retorno de status (escolher uma; preferir webhook)

| Opção                            | Prós                | Contras                            |
| -------------------------------- | ------------------- | ---------------------------------- |
| **Webhook** em problema/recovery | Tempo real, simples | Precisa mapear host → `device_key` |
| Worker poll API history/triggers | Controle total      | Latência + carga API               |
| Export DB Zabbix → worker        | Robusto em volume   | Acoplamento ao schema Zabbix       |

**Recomendado:** webhook → worker → UPSERT saúde externa.

Payload mínimo:

```json
{
  "domain": "bsod",
  "ope": "mns",
  "device_key": "4c:12:65:e5:87:de",
  "avail_status": 0,
  "event": "problem",
  "trigger": "ICMP unavailable",
  "zabbix_hostid": 12345,
  "checked_at": "2026-08-14T23:00:00-03:00"
}
```

Autenticação: shared secret / mTLS na rede interna.

### C) Deep-link UI (opcional)

Botão “Abrir no Zabbix” com `zabbix_hostid` + URL base em env (`ZABBIX_UI_BASE_URL`).

## Fases

### Fase 0 — Fundação (ops + doc)

- [ ] Definir onde sobe o proxy (rede que alcança PME/CMTS; depois OLT GPON)
- [ ] Inventário de community SNMP / credenciais (cofre; não no git)
- [ ] Repo ou pasta `deploy/zabbix/` para templates JSON/YAML
- [ ] ADR curto: “Zabbix não escreve SIR; worker é a fronteira”

### Fase 1 — BSOD híbrido (não substitui PathTrak/CMTS)

- [ ] LLD a partir de `bsod_inventory` (PME/BSoD)
- [ ] Template Zabbix: ICMP (onde houver IP) + opcional SNMP CPE
- [ ] Webhook → colunas/`bsod` saúde externa no SIR
- [ ] UI: badge ou coluna interna “Zabbix” **sem** mudar ainda o status efetivo dos alarmes
- [ ] Validar MNS (ARRIS/CASA/CISCO) e SLS

### Fase 2 — BSOD: Zabbix no status efetivo

- [ ] Incluir Zabbix em `deriveEffectiveMonitorStatus` (ou sucessor)
- [ ] Desligar coleta redundante só quando cobrirza ≥ limiar (ex. >95% inventário com host Zabbix)
- [ ] Manter CMTS SNMP reg como fallback onde Zabbix não tiver item
- [ ] Atualizar runbook `bsod-ingest.md`

### Fase 3 — GPON (mesmo pipeline)

- [ ] Domínio `gpon`: inventário + monitor no SIR (migrations)
- [ ] Worker `workers/gpon` (ou módulo no mesmo worker multi-domínio)
- [ ] LLD `domain=gpon` + template ONT/OLT (óptica, LOS, RX power)
- [ ] UI alarmes GPON reutilizando tratativas
- [ ] Webhook com o mesmo contrato (`domain`, `ope`, `device_key`)

### Fase 4 — Operação

- [ ] Alertas Zabbix vs alarmes Empresarial: quem pagina o plantão?
- [ ] Retenção histórico SIR vs Zabbix
- [ ] Runbook: falha do proxy, backlog de webhook, re-LLD

## Fronteiras (não negociáveis)

| Permitido                      | Proibido                          |
| ------------------------------ | --------------------------------- |
| Worker grava SIR               | Next scrapa SNMP/Zabbix           |
| Zabbix proxy na rede de acesso | Zabbix UPDATE direto no MySQL SIR |
| Token de serviço no LLD        | Expor LLD sem auth na internet    |
| Templates versionados          | Credenciais SNMP no git           |

## Env (esboço)

```bash
# Next / worker (quando implementar)
ZABBIX_UI_BASE_URL=https://zabbix.exemplo.local
ZABBIX_WEBHOOK_SECRET=troque_me
ZABBIX_LLD_TOKEN=troque_me
# Proxy/ops ficam no Zabbix server; não no .env do Next
```

Espelhar em `.env.example` na hora da feature (regra `emp-env`).

## Critérios de aceite (BSOD Fase 1)

1. Hosts LLD ≈ inventário PME/BSoD do `ope` habilitado.
2. Evento ICMP down no Zabbix aparece no SIR em &lt; 2 min.
3. Recovery limpa/atualiza status.
4. App continua operando se Zabbix cair (status efetivo atual intacto na Fase 1).
5. Nenhum segredo Zabbix commitado.

## Critérios de aceite (GPON Fase 3)

1. Mesmo webhook/LLD com `domain=gpon`.
2. Alarme GPON na UI com tratativa.
3. Sem acoplamento de schema BSOD ↔ GPON além do contrato comum.

## Riscos

| Risco                           | Mitigação                                            |
| ------------------------------- | ---------------------------------------------------- |
| MAC ≠ host Zabbix               | Macro `{DEVICE_KEY}` obrigatória no template LLD     |
| Volume de webhooks              | Dedup por `(domain, ope, device_key)` + rate limit   |
| Proxy sem rota a alguns CPE     | Manter CMTS SNMP reg (BSOD) / SNMP OLT (GPON)        |
| Dupla verdade PathTrak × Zabbix | Fase híbrida + métrica `false_offline` / divergência |

## Fora de escopo (neste plano)

- Substituir Xpertrak/PathTrak por completo
- Migrar TMIP/SDH para Zabbix
- UI de configuração de triggers dentro do Empresarial

## Próxima ação concreta

Quando for implementar: abrir issue/ADR + migration `0xx_ext_monitor` (ou colunas BSOD) + esqueleto `POST /api/internal/zabbix/webhook` e `GET .../lld`, começando só por **ope=mns** em lab.
