# Empresarial GRNO

App **Next.js** (App Router) para monitoramento operacional: SIR (RAL/REC), BSOD, SDH/TMIP, GRB (telnet + Critel), tratativas e relatórios.

Workers gravam incidentes no MySQL SIR; o Next lê SIR/HFC e escreve tabelas de aplicação (auth, preferências, notificações, tratativas).

## Documentação

Tudo começa em **[docs/README.md](docs/README.md)**.

| Ambiente           | Guia                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| Lab                | [docs/getting-started/development.md](docs/getting-started/development.md) |
| Produção (install) | [docs/runbooks/production-install.md](docs/runbooks/production-install.md) |
| Produção (release) | [docs/runbooks/production-release.md](docs/runbooks/production-release.md) |
| Arquitetura        | [docs/architecture/overview.md](docs/architecture/overview.md)             |
| Contribuir         | [CONTRIBUTING.md](CONTRIBUTING.md)                                         |
| Segurança          | [SECURITY.md](SECURITY.md)                                                 |
| Changelog          | [CHANGELOG.md](CHANGELOG.md)                                               |

## Setup rápido (lab)

```bash
cd /usr/local/empresarial
cp .env.example .env.local
npm install
npm run db:bootstrap
npm run db:migrate && npm run db:import   # lab; NÃO use db:import em prod
npm run db:seed-staff
npm run env:check
npm run dev    # http://localhost:3003
```

Passo a passo: [docs/getting-started/development.md](docs/getting-started/development.md).

## Lint / format

```bash
npm run format
npm run lint
npm run validate   # pre-push (format:check + lint)
```

## Deploy (produção)

Modelo: **SSH + systemd**. Checklist: [docs/runbooks/production-install.md](docs/runbooks/production-install.md) · release: [docs/runbooks/production-release.md](docs/runbooks/production-release.md) · units: [deploy/README.md](deploy/README.md).

Porta **3003** · usuário típico **`datacenter`**. Não use units `*-lab*` em produção.

## Regras

- Scrapers **não** rodam dentro do Next.
- Este repo **não escreve** no MySQL `hfc-sls`.
- Env: `.env.example` ↔ `.env.local` + `npm run env:check`.
- Fronteiras: [docs/architecture/data-and-write-boundaries.md](docs/architecture/data-and-write-boundaries.md).
