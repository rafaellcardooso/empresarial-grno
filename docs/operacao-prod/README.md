# Registro operacional — ações manuais (lab / produção)

Mudanças no código que **exigem passos no host** (systemd, `.env`, venv Python, migrations, etc.) entram aqui — **uma entrada por mudança**, não por dia de calendário.

Guides estáveis (instalação, APIs, checklist genérico de deploy):

- [Lab](../2026-07-27-lab.md)
- [Produção](../2026-07-26-deploy-producao.md)
- [Referência (APIs/env)](../2026-07-26-operacao.md)
- [Bots Telegram](../2026-07-26-bots-telegram.md)
- Units + troubleshooting: [deploy/README.md](../../deploy/README.md)

**Fluxo:** lab primeiro → marcar **Lab** como `aplicado` → repetir em produção → marcar **Prod** como `aplicado`.

Skill Cursor: `.cursor/skills/emp-deploy-producao/SKILL.md`.

**Units Telegram / Next lab:** sufixo `*-lab*` (`User=rcard`); produção usa units sem `-lab` (`User=datacenter`). Ver [2026-07-26-bots-telegram.md](../2026-07-26-bots-telegram.md).

---

## Ordem sugerida — release 2026-07-25/26 (prod pendente)

Após `git pull origin main` na raiz, aplicar entradas **nesta ordem** (dependências entre si):

| #   | Entrada                                                                | Por quê                                 |
| --- | ---------------------------------------------------------------------- | --------------------------------------- |
| 1   | [Tratativas — migrations 006–008](2026-07-26-tratativas-migrations.md) | DDL antes da UI/API de workflow         |
| 2   | [GRB / Critel — env + build Next](2026-07-26-grb-critel-env.md)        | Telnet e gráficos exigem chaves e build |
| 3   | [Bots Telegram SIR + dashboard PNG](2026-07-26-telegram-sir-bots.md)   | Consome `/api` do Next (passo 2)        |

Deploy rotineiro sem delta manual: [2026-07-26-deploy-producao.md §9](../2026-07-26-deploy-producao.md#9-atualização-rotineira-release).

---

## Índice

| Data       | Entrada                                                                                   | Lab      | Prod     | Escopo     |
| ---------- | ----------------------------------------------------------------------------------------- | -------- | -------- | ---------- |
| 2026-07-30 | [Relatórios gerenciais — migration 014 + SIR + TMIP](2026-07-30-relatorios-gerenciais.md) | pendente | pendente | lab + prod |
| 2026-07-29 | [Tratativa unificada — concorrência ativa](2026-07-29-tratativa-unificada.md)             | pendente | pendente | lab + prod |
| 2026-07-29 | [TMIP / SDH — migrations 009–011 + timer ingest](2026-07-29-tmip-sdh-ingest.md)           | pendente | pendente | lab + prod |
| 2026-07-29 | [Tratativas — colunas padronizadas](2026-07-29-tratativas-colunas-padronizadas.md)        | pendente | pendente | lab + prod |
| 2026-07-26 | [Tratativas — migrations 006–008](2026-07-26-tratativas-migrations.md)                    | aplicado | pendente | lab + prod |
| 2026-07-26 | [GRB / Critel — env + build Next](2026-07-26-grb-critel-env.md)                           | aplicado | pendente | lab + prod |
| 2026-07-26 | [Bots Telegram SIR + dashboard PNG](2026-07-26-telegram-sir-bots.md)                      | aplicado | pendente | lab + prod |

---

## Formato de cada entrada

Arquivo: `AAAA-MM-DD-tema-kebab.md` (tema em português, kebab-case).

Cabeçalho obrigatório (metadados em blockquote):

```markdown
> **Data:** AAAA-MM-DD · **Escopo:** lab + prod | só prod · **Lab:** pendente | aplicado · **Prod:** pendente | aplicado | n/a
```

Seções:

| Seção                 | Conteúdo                                              |
| --------------------- | ----------------------------------------------------- |
| **Resumo**            | 1–3 frases: o que mudou e por que precisa ação manual |
| **Impacto**           | O que quebra; units/serviços/arquivos afetados        |
| **Pré-requisitos**    | Backup, `git pull`, janela de manutenção, etc.        |
| **Passos — Lab**      | Comandos copy-paste para o lab (`*-lab*`)             |
| **Passos — Produção** | Comandos para Debian (`datacenter`)                   |
| **Validação**         | `systemctl`, `curl`, smoke test                       |
| **Rollback**          | Reverter units/env se necessário                      |
| **Referências**       | Docs de domínio (bots, deploy, operação)              |

Regras:

- Sem secrets reais (tokens, senhas, URLs internas sensíveis).
- Atualizar a coluna **Lab** / **Prod** neste README ao concluir cada ambiente.
- Deploy rotineiro (`git pull`, `npm run build`, restart) continua no [checklist de produção](../2026-07-26-deploy-producao.md); aqui só o **delta** manual da mudança.
