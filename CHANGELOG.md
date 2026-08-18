# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento de mensagens de commit segue [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added

- Seção **Normalizados aguardando confirmação** em RAL, REC e SDH (tratativa ativa após normalização da fonte).
- Encerramento auditado de tratativas RAL/REC já normalizadas, distinto da liberação.
- Documentação reestruturada: runbooks de produção, inventário de host, referência e ADRs.

### Changed

- Ingest BSOD em cadências distintas: Xpertrak 10 min, SNMP 10 min, LDAP 3 h, CRM 6 h.
- Planilha local BSOD preenche lacunas de cliente, designação e VLAN no inventário por contrato.
- Belém (BLM) habilitada no ingest BSOD com 13 CMTS e faixas PME.
- Documentação alinhada a fontes estáveis (sem monólitos datados como procedimento atual).
- SDH permite observação/encerramento de alarme inativo com tratativa aberta; claim permanece só em ativo.
- Deploy produção padronizado em `npm ci` + restart seletivo; TMIP incluído no install.
- Ingest BSOD (`bsod-ingest.timer`) incluído em install/inventory, `deploy/README`, lab e troubleshooting.
- Next em **4001** com `basePath` `/empresarial` (Nginx); docs, units e `EMPRESARIAL_API_URL` alinhados.
- Unit `empresarial-next`: `HOSTNAME=0.0.0.0` para acesso direto `:4001` (pfSense); nota nvm no install.
- Client `fetch` de RAL/REC detalhes e demais APIs passam por `apiFetch` (respeitam `/empresarial`).
- `fetchJson` (notificações) e default de `NEXT_PUBLIC_BASE_PATH` alinhados ao `basePath` do Next.

## [2026-07-30]

### Added

- Relatório gerencial SIR (`/relatorios/sir`) com backlog RAL/REC, idade, aberturas e CSV.
- Painel unificado de tratativa (BSOD, SIR e SDH) com assunção, observação e cronologia.
- Migrations `012`–`014` (colunas padronizadas, unicidade de tratativa ativa, eventos SDH tipados).
- Validação de CSV/atualidade no ingest TMIP (`SFTP_MAX_AGE_HOURS`).
- KPIs filtráveis Total / Pendente / Em tratativa em SIR, RAL e REC.

### Changed

- Relatório BSOD usa coorte (chamados iniciados no período) no funil e duração média.
- Relatório SDH preserva histórico de eventos sem exigir alarme ainda ativo.
- Ranking “Logins no período” do SDH visível apenas para `STAFF`.
- Indicador de refresh de monitoramento compactado na navbar.

### Fixed

- Deduplicação determinística da última leitura SNMP no inventário BSOD.
- Ingest TMIP aborta sincronização quando a fonte está vazia, malformada ou desatualizada.

## [2026-07-29]

### Added

- Ingest TMIP/SDH via SFTP e monitoramento `/sdh`.
- Relatório analítico SDH (`/relatorios/sdh`).
- Separação de alarmes BSOD do inventário completo.
- Paginação SQL do inventário BSOD e refresh global de monitoramento.

### Changed

- Documentação operacional reorganizada com hub `docs/` e registro `operacao-prod/`.
