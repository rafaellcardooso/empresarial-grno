#!/usr/bin/env python3
"""Gera um deck gerencial .pptx a partir do template Claro (grava o arquivo em `out/` ou em `--out`)."""

from __future__ import annotations

import argparse
import importlib
import sys
from pathlib import Path

PRESENTATION_ROOT = Path(__file__).resolve().parent
if str(PRESENTATION_ROOT) not in sys.path:
    sys.path.insert(0, str(PRESENTATION_ROOT))

from lib.template import open_template

DEFAULT_DECK = "grno_empresarial"
OUT_DIR = PRESENTATION_ROOT / "out"


def parse_args() -> argparse.Namespace:
    """Lê o nome do deck e o caminho de saída opcional."""
    parser = argparse.ArgumentParser(description="Gera deck gerencial .pptx")
    parser.add_argument("deck", nargs="?", default=DEFAULT_DECK, help="pasta em decks/ (padrão: grno_empresarial)")
    parser.add_argument("--out", type=Path, help="arquivo .pptx de saída")
    return parser.parse_args()


def list_missing_shots(deck) -> list[Path]:
    """Lista as capturas exigidas pelo deck que não existem na pasta `shots/` (fora do git)."""
    shots_dir = getattr(deck, "SHOTS_DIR", None)
    names = getattr(deck, "REQUIRED_SHOTS", [])
    if shots_dir is None:
        return []
    return [shots_dir / f"{name}.png" for name in names if not (shots_dir / f"{name}.png").is_file()]


def main() -> int:
    """Monta o deck escolhido e grava o .pptx; aborta listando capturas ausentes."""
    args = parse_args()
    deck = importlib.import_module(f"decks.{args.deck}")
    missing = list_missing_shots(deck)
    if missing:
        print("[DECK] Capturas ausentes (shots/ fica fora do git):", file=sys.stderr)
        for path in missing:
            print(f"[DECK]   {path}", file=sys.stderr)
        return 1
    if hasattr(deck, "DATA_SOURCE"):
        print(f"[DECK] Números: {deck.DATA_SOURCE}")
    out_path = args.out or OUT_DIR / f"{deck.TITLE}.pptx"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    prs = open_template()
    deck.build(prs)
    prs.save(str(out_path))
    print(f"[DECK] {out_path} ({len(prs.slides)} slides)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
