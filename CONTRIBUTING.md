# Guia de contribuição

Obrigado por contribuir com o Empresarial GRNO. Este guia cobre o fluxo mínimo esperado no repositório.

## Antes de começar

1. Leia [README.md](README.md) e o hub [docs/README.md](docs/README.md).
2. Suba o lab com [docs/2026-07-27-lab.md](docs/2026-07-27-lab.md).
3. Alinhe env com `npm run env:check` (rule `.cursor/rules/emp-env.mdc`).

## Fluxo de trabalho

1. Atualize `main` e crie um branch curto (`feat/...`, `fix/...`, `docs/...`).
2. Implemente a mudança com unidades pequenas (rule `emp-size`).
3. Atualize documentação quando a mudança afetar ops, env, API ou deploy.
4. Rode validação local:

```bash
npm run format
npm run lint
npx tsc --noEmit
npm run env:check
```

5. Abra PR com resumo e plano de teste. Não faça push forçado em `main`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) em inglês:

```text
feat: add SIR managerial report page
fix: abort TMIP sync on empty CSV
docs: add architecture overview
```

- Assunto imperativo, ≤72 caracteres.
- Corpo opcional com o **porquê** (linhas ≤100 caracteres).
- Não use `--no-verify`.
- Não commite `.env.local`, `workers/*/.env` nem states de runtime.

## Escopo de mudanças

| Área                                 | Pode                                         | Não pode                      |
| ------------------------------------ | -------------------------------------------- | ----------------------------- |
| Next (`app/`, `components/`, `lib/`) | Ler SIR/HFC; escrever tratativas             | Scraper, escrita em `hfc-sls` |
| Workers                              | Gravar tabelas do próprio domínio            | Misturar units lab/prod       |
| Migrations                           | Nova migration numerada em `migrations/sir/` | Alterar migration já aplicada |
| Env                                  | Espelhar example ↔ local                     | Commitar segredos             |

## Documentação obrigatória

Ao adicionar:

- variável de ambiente → atualizar `.env.example` + local + `npm run env:check`
- passo manual no host → entrada em `docs/operacao-prod/`
- comportamento de arquitetura → [docs/architecture.md](docs/architecture.md) e/ou [docs/2026-07-26-operacao.md](docs/2026-07-26-operacao.md)
- release relevante → entrada em [CHANGELOG.md](CHANGELOG.md)

## Revisão

Checklist sugerido no PR:

- [ ] Lint/format/TypeScript ok
- [ ] `env:check` ok se tocou env
- [ ] Migration numerada e documentada, se houver DDL
- [ ] UI paginada quando houver listagem potencialmente grande
- [ ] Sem secrets, dumps ou states versionados
