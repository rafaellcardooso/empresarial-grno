# Apresentações gerenciais

Gera decks `.pptx` no template Claro com python-pptx. Regras de conteúdo e captura de prints: skill `emp-apresentacao-gerencial` (`.cursor/skills/`).

## Uso

```bash
cd scripts/presentation
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python build.py                      # deck padrão: grno_empresarial
venv/bin/python preview.py "out/GRNO Empresarial - Apresentação.pptx" 4 6
```

`build.py` grava em `out/` (gitignored) ou em `--out`. `preview.py` exige WSL com PowerPoint instalado no Windows e grava PNG em `out/preview/`.

## Estrutura

- `lib/`: tema, template e primitivas de desenho compartilhadas.
- `assets/`: template e logo Claro.
- `decks/grno_empresarial/`: slides do deck de status do portal; `facts.py` formata os textos a partir de `snapshot.json`.
- `decks/grno_empresarial/snapshot.json`: números da edição (commitado; só agregados).
- `decks/<deck>/shots/`: capturas PNG do portal, **fora do git** (podem conter nome e IP de cliente). A lista exigida fica em `REQUIRED_SHOTS` no `__init__.py` do deck; `build.py` aborta e lista as ausentes.

## Nova edição

1. Números: `npm run deck:facts` (raiz do repo) roda `collect-facts.ts`, que usa as mesmas queries dos relatórios do portal (`getSirReport` no período padrão de 30 dias, `countSdhByVendor`) e conta os commits. Só faz `SELECT`. Rodar **no servidor de produção**, onde `.env.local` aponta para o SIR real:

   ```bash
   # no servidor, após o deploy da versão atual
   cd /usr/local/empresarial && npm run -s deck:facts -- --stdout > /tmp/snapshot.json
   # copiar para decks/grno_empresarial/snapshot.json na máquina que gera o deck
   ```

   Opções: `--env <arquivo>` (padrão `.env.local`), `--out <arquivo>`, `--stdout`. Rodado no lab, grava números do lab; `build.py` sempre mostra a origem do snapshot.

2. Capturas: refazer as telas de `REQUIRED_SHOTS` no portal de produção.
3. Gerar e conferir: `build.py` e `preview.py`.
