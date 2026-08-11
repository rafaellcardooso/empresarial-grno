# Segurança

## Relatar vulnerabilidades

Não abra issue pública com detalhes exploráveis.

Envie o relato ao time **Empresarial GRNO / operação datacenter** (canal interno staff já usado para aprovações e incidentes), incluindo:

- descrição do impacto
- passos para reproduzir
- versão ou commit afetado
- mitigação sugerida, se houver

Expectativa: triagem pelo staff do repositório; não há SLA público formal neste documento.

## Escopo

Cobre o monorepo Empresarial (Next, workers SIR/TMIP, bots Telegram, units systemd) e a exposição das APIs na porta **4001** (path `/empresarial`, tipicamente atrás do Nginx do portal).

## Práticas do repositório

- Não commitar secrets (`.env.local`, `workers/*/.env`, tokens).
- Usar placeholders nos `.env.example`.
- Rotacionar credenciais se um segredo vazar em log, dump ou PR.
- Manter lab e produção com units e secrets separados.
- APIs públicas dos bots não devem ficar expostas na internet sem controle de rede.
- Ver [docs/architecture/data-and-write-boundaries.md](docs/architecture/data-and-write-boundaries.md).
