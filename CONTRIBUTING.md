# Guia de contribuição

Obrigado por contribuir com o Empresarial GRNO. Este guia cobre o fluxo mínimo esperado no repositório.

## Antes de começar

1. Leia [README.md](README.md) e o hub [docs/README.md](docs/README.md).
2. Suba o lab com [docs/getting-started/development.md](docs/getting-started/development.md).
3. Alinhe env com `npm run env:check` (rule `.cursor/rules/emp-env.mdc`).

## Fluxo de trabalho

1. Atualize `main` e crie um branch curto (`feat/...`, `fix/...`, `docs/...`).
2. Implemente a mudança com unidades pequenas (rule `emp-size`).
3. Atualize documentação quando a mudança afetar ops, env, API ou deploy.
4. Rode validação local:

```bash
npm run validate
npx tsc --noEmit
npm run env:check   # se tocou env
```

5. Abra PR com resumo e plano de teste. Não faça push forçado em `main`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) em inglês:

```text
feat: add SIR managerial report page
fix: abort TMIP sync on empty CSV
docs: restructure production runbooks
```

- Assunto imperativo, ≤72 caracteres.
- Corpo opcional com o **porquê** (linhas ≤100 caracteres).
- Não use `--no-verify`.
- Não commite `.env.local`, `workers/*/.env` nem states de runtime.

## Escopo de mudanças

| Área                                 | Pode                                                             | Não pode                                                     |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Next (`app/`, `components/`, `lib/`) | Ler SIR/HFC; escrever tabelas de aplicação (auth, tratativas, …) | Scraper; escrita em `hfc-sls` ou tabelas-fonte `rals`/`recs` |
| Workers                              | Gravar tabelas do próprio domínio                                | Misturar units lab/prod                                      |
| Migrations                           | Nova migration numerada em `migrations/sir/`                     | Alterar migration já aplicada                                |
| Env                                  | Espelhar example ↔ local                                         | Commitar segredos                                            |

Fronteiras: [docs/architecture/data-and-write-boundaries.md](docs/architecture/data-and-write-boundaries.md).

## Documentação obrigatória

Ao adicionar:

- variável de ambiente → atualizar `.env.example` + local + `npm run env:check`
- procedimento operacional → runbook em `docs/runbooks/` (ou nota histórica em `docs/changes/` se for só registro)
- comportamento de arquitetura → `docs/architecture/` e/ou `docs/reference/`
- release relevante → [CHANGELOG.md](CHANGELOG.md)

Documentação viva **sem** data no nome. Datas só em `docs/changes/` e ADRs.

## Revisão

Checklist sugerido no PR:

- [ ] `npm run validate` e `tsc --noEmit` ok
- [ ] `env:check` ok se tocou env
- [ ] Migration numerada e documentada, se houver DDL
- [ ] UI paginada quando houver listagem potencialmente grande
- [ ] Sem secrets, dumps ou states versionados
- [ ] Links de docs apontam para caminhos canônicos
