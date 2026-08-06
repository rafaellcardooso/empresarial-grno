# ADR 0004 — Ownership BSOD no SIR

- **Status:** Aceito
- **Data:** 2026-08-06

## Contexto

O inventário PME/BSoD e as amostras RF viviam no MySQL `hfc-sls` (`tbl_inventory_pme`, `tbl_monitor_pme`), com leitura no Next e enrich no Monitor HFC. Multi-cidade (SLS, MNS, BLM) e classificação por DDD pedem ownership no monorepo empresarial, com a mesma fronteira worker→SIR já usada por TMIP/SDH.

## Decisão

- `workers/bsod` escreve `bsod_cables`, `bsod_inventory` e `bsod_monitor` no MySQL SIR.
- Next `/bsod` lê somente essas tabelas SIR (não usa mais HFC para BSOD).
- Config por `ope`/`ddd` (SLS/MNS/BLM); coleta habilitada por cidade.
- Enrich SNMP/LDAP/Xpertrak **não** roda no hfc-sls após o cutover; crônicos QoE permanecem no HFC.

## Consequências

- Atualizar `data-and-write-boundaries.md` e health (`/api/saude`) para refletir SIR como fonte BSOD.
- Cutover exige migration `015` + worker populando SLS antes do deploy da UI.
- `HFC_DB_*` deixa de ser necessário para o domínio BSOD (pode permanecer por outros usos/legado).
