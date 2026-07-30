# ADR 0002 — Units lab vs produção

- **Status:** Aceito
- **Data:** 2026-07-30

## Contexto

Lab (WSL) e produção compartilham o mesmo path `/usr/local/empresarial` e a porta 3003. Misturar units causa conflito de processo, `states/` e permissões.

## Decisão

- Produção: units **sem** sufixo `-lab`, `User=datacenter`, Next = `npm run start` após `build`.
- Lab: units com sufixo `-lab`, `User=rcard`, Next = `npm run dev` (hot reload).
- Nunca habilitar ambos os conjuntos no mesmo host.

## Consequências

- Documentação e skills devem sempre discriminar o ambiente.
- Secrets e `.env` não são copiados entre lab e prod.
