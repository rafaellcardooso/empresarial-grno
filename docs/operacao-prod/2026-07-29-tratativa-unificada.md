# Tratativa unificada — concorrência ativa

> **Data:** 2026-07-29 · **Escopo:** lab + prod · **Lab:** pendente · **Prod:** pendente

## Resumo

A migration `013` adiciona a coluna gerada `active_guard` e o índice único
`uq_app_tratativas_active`, garantindo no máximo uma tratativa aberta por
domínio/chave (BSOD, RAL, REC). A UI unifica o fluxo no painel **Tratar**.

## Impacto

Sem a migration, a assunção automática do painel permanece funcional via checagem
na aplicação, mas duas requisições concorrentes ainda podem criar duas linhas
ativas. Com o índice, a segunda inserção falha com `ER_DUP_ENTRY` e o adapter
trata como conflito de responsável.

## Pré-requisitos

- Migrations `006`–`008` e `012` aplicadas.
- Backup recente do banco SIR.

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
2. Clicar em **Tratar** e confirmar assunção automática.
3. Em outra sessão, abrir o mesmo registro e ver modo somente leitura.
4. Registrar observação, acionamento WhatsApp e (BSOD) validação/FCA/conclusão.

## Rollback

Remover o índice e a coluna gerada somente se necessário:

```sql
ALTER TABLE app_tratativas
  DROP INDEX uq_app_tratativas_active,
  DROP COLUMN active_guard;
```

## Referências

- [2026-07-26-operacao.md §9](../2026-07-26-operacao.md#9-tratativas-workflow-bsodsir)
- `migrations/sir/013_tratativa_active_unique.sql`
- `lib/tratativa/open-treatment.ts`
