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
- `decks/grno_empresarial/`: slides do deck de status do portal; `facts.py` concentra números e datas da edição.
- `decks/<deck>/shots/`: capturas PNG do portal, **fora do git** (podem conter nome e IP de cliente). A lista exigida fica em `REQUIRED_SHOTS` no `__init__.py` do deck; `build.py` aborta e lista as ausentes.

Nova edição: capturar as telas no portal de produção para `shots/`, atualizar `facts.py`, gerar e conferir o preview.
