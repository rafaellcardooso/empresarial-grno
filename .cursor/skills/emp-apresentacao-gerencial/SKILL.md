---
name: emp-apresentacao-gerencial
description: Gera e atualiza apresentações gerenciais (.pptx, template Claro) do GRNO Empresarial com python-pptx em scripts/presentation. Use quando o usuário pedir apresentação, deck, slides, relatório gerencial em PowerPoint, atualizar números da apresentação ou incluir prints do portal.
---

# Apresentação gerencial (pptx)

Ferramenta: `scripts/presentation/` (README na pasta). Público-alvo: gerência e diretoria.

## Estrutura

| Caminho                      | Conteúdo                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `lib/theme.py`               | Paleta, fonte Aptos, margens, posição do logo                                                 |
| `lib/primitives.py`          | `add_box`, `add_text`, `add_label`, `add_header`, `add_footer`, `add_screenshot`, `set_notes` |
| `lib/template.py`            | Abre `assets/claro-template.pptx` mantendo só a capa                                          |
| `decks/<deck>/__init__.py`   | `TITLE`, `SLIDE_BUILDERS` (ordem dos slides), `SHOTS_DIR` e `REQUIRED_SHOTS`                  |
| `decks/<deck>/snapshot.json` | Números da edição, gerados por `npm run deck:facts` (`collect-facts.ts`)                      |
| `decks/<deck>/facts.py`      | Formata textos a partir do snapshot; dados fixos (stakeholders, circuito do exemplo)          |
| `decks/<deck>/shots/`        | Capturas PNG do portal, **fora do git**; `build.py` aborta listando as ausentes               |

Deck novo: copiar a estrutura de `decks/grno_empresarial/`, um módulo por bloco de slides, cada slide uma função `build_x(prs)`. Limites de `emp-size` valem aqui (arquivo ≤ 350 linhas, função ≤ 60).

## Gerar e conferir

```bash
cd scripts/presentation
python3 -m venv venv && venv/bin/pip install -r requirements.txt   # primeira vez
venv/bin/python build.py [deck] [--out arquivo.pptx]
venv/bin/python preview.py "out/<TITLE>.pptx" [slides...]           # PNG em out/preview/
```

Depois de qualquer mudança visual, renderizar com `preview.py` e **ler os PNG** dos slides alterados: texto não pode transbordar, encavalar ou quebrar em lugar ruim. Entregar ao usuário copiando o `.pptx` para o destino pedido; se o arquivo estiver aberto no PowerPoint, gravar com sufixo ` v2`.

## Números

- Sempre do sistema em produção, nunca do lab: `npm run deck:facts` no servidor de produção; conferir a origem impressa por `build.py`.
- O coletor reutiliza as queries dos relatórios (`getSirReport`, `countSdhByVendor`); número novo entra em `collect-facts.ts` chamando a função do portal, nunca SQL duplicado.
- Sem metas ou percentuais inventados: indicador sem histórico vira "linha de base" com janela de medição.
- Retorno sem dado financeiro é qualitativo (tempo liberado, resposta mais rápida, histórico).

## Prints do portal

- Capturar no portal de produção com o browser MCP (`browser_take_screenshot` nativo); somente leitura, nunca gravar credenciais em arquivo.
- Não usar zoom CSS nem emulação de viewport (quebra cliques e gera imagem em mosaico); navegar por URL quando possível.
- Recortar com Pillow considerando a escala real do PNG (largura do arquivo ÷ largura exibida).
- Validações reais (GRB, Critel): usar circuito de RAL/REC ativa, mesmo circuito nos dois prints, e citar circuito e data no slide.
- Prints com nome de cliente ou IP: avisar o usuário antes de distribuir; `shots/` nunca vai para o git.

## Nova edição (relatório atualizado)

1. Capturar de novo as telas listadas em `REQUIRED_SHOTS` no portal de produção (mesmos nomes de arquivo).
2. No servidor de produção: `npm run -s deck:facts -- --stdout > /tmp/snapshot.json`; copiar para `decks/grno_empresarial/snapshot.json`.
3. Revisar textos que mudaram de status (módulo entregue sai de "em desenvolvimento").
4. `build.py`, `preview.py`, ler os PNG e entregar.

## Regras editoriais

- Português, frases curtas; cada slide com etiqueta, título, subtítulo, rodapé com mensagem-chave e notas do apresentador com tempo (`[1 min]`).
- SIR sempre como "SIR (RAL, REC, DSR e TCQ)" na primeira menção do slide.
- Nomes: "Portal BSOD" (não CRM nocclaro); "TMIP" sem "planilha" ou "(SFTP)"; GRB e Critel como apoio às validações.
- Não citar Telegram, SNMP, Nginx nem detalhes de infraestrutura irrelevantes para gestão.
- Autoria: o Datacenter Norte desenvolveu; o portal é usado pelo time Empresarial.
- Riscos como continuidade (backup semanal em 2 servidores distintos, código versionado, coleta validada), sem tom de fragilidade.
- Tratativa sempre com validação em dois momentos: antes de acionar e antes de encerrar. Validação formal com FCA existe só no fluxo BSOD; não afirmar para RAL/REC.
- Integrações não entregues aparecem como "em desenvolvimento" ou "próxima entrega" (ex.: carimbo técnico no SIR, planta instalada, GPON).
- Rankings e listas seguem `emp-rankings` (sem Top N salvo pedido explícito).
- Sem marcadores pendentes (`[VALIDAR]`, `[ATUALIZAR]`) no texto visível nem nas notas da versão entregue.
