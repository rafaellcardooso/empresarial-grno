# Tratativas — colunas e acionamento SDH

> **Data:** 2026-07-29 · **Escopo:** lab + prod · **Lab:** pendente · **Prod:** pendente

## Resumo

A migration `012` adiciona eventos de observação às tratativas BSOD/SIR e
acionamento à cronologia SDH. O DDL precisa ser aplicado antes de publicar a UI.

## Impacto

Sem a migration, salvar observação ou acionar um incidente SDH falha por valor
de enum desconhecido. As consultas e os ingests permanecem compatíveis.

## Pré-requisitos

- Código da release disponível no host.
- Backup recente do banco SIR.
- Migrations SDH `009`–`011` já aplicadas.

## Passos — Lab

```bash
cd /usr/local/empresarial
npm run db:migrate
npm run build
sudo systemctl restart empresarial-next-lab
```

## Passos — Produção

```bash
cd /usr/local/empresarial
git pull origin main
npm ci
npm run db:migrate
npm run build
sudo systemctl restart empresarial-next
```

## Validação

1. Abrir `/bsod`, `/sir/rals`, `/sir/recs` e `/sdh`.
2. Confirmar as colunas `STATUS`, `OBSERVAÇÃO` e `AÇÕES`.
3. Salvar uma observação em RAL/REC ou BSOD.
4. Marcar um alarme SDH em tratativa e abrir o acionamento.

## Rollback

Reverter a aplicação e manter os novos valores dos enums. O schema ampliado é
retrocompatível e evita remover eventos já registrados.

## Referências

- [Operação](../2026-07-26-operacao.md)
- [Deploy de produção](../2026-07-26-deploy-producao.md)
