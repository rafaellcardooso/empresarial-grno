# Segurança

## Relatar vulnerabilidades

Não abra issue pública com detalhes exploráveis.

Envie o relato para o time responsável pelo Empresarial GRNO (canal interno da operação / staff do repositório), incluindo:

- descrição do impacto
- passos para reproduzir
- versão ou commit afetado
- mitigação sugerida, se houver

## Práticas do repositório

- Não commitar secrets (`.env.local`, `workers/*/.env`, tokens).
- Usar placeholders nos `.env.example`.
- Rotacionar credenciais se um segredo vazar em log, dump ou PR.
- Manter lab e produção com units e secrets separados.
