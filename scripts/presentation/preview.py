#!/usr/bin/env python3
"""Exporta slides de um .pptx para PNG via PowerPoint (COM) no Windows hospedeiro do WSL; grava em `out/preview/`."""

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

PRESENTATION_ROOT = Path(__file__).resolve().parent
PREVIEW_DIR = PRESENTATION_ROOT / "out" / "preview"
POWERSHELL = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"

EXPORT_SCRIPT = r"""
$ErrorActionPreference = 'Stop'
$work = Join-Path $env:TEMP 'deck_preview'
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $work | Out-Null
Copy-Item -LiteralPath '{source}' -Destination (Join-Path $work 'deck.pptx')
$app = New-Object -ComObject PowerPoint.Application
$deck = $app.Presentations.Open((Join-Path $work 'deck.pptx'), $true, $false, $false)
$slides = @({slides})
if ($slides.Count -eq 0) {{ $slides = 1..$deck.Slides.Count }}
foreach ($i in $slides) {{ $deck.Slides.Item($i).Export((Join-Path $work "slide$i.png"), 'PNG', 1600, 900) }}
$deck.Close()
Write-Output $work
"""


def to_windows_path(path: Path) -> str:
    """Converte caminho do WSL para caminho Windows com `wslpath -w`."""
    return subprocess.check_output(["wslpath", "-w", str(path)], text=True).strip()


def to_wsl_path(path: str) -> Path:
    """Converte caminho Windows para caminho do WSL com `wslpath -u`."""
    return Path(subprocess.check_output(["wslpath", "-u", path], text=True).strip())


def main() -> int:
    """Exporta os slides pedidos (todos por padrão) e copia os PNGs para `out/preview/`."""
    parser = argparse.ArgumentParser(description="Exporta slides para PNG via PowerPoint")
    parser.add_argument("pptx", type=Path, help="arquivo .pptx gerado")
    parser.add_argument("slides", nargs="*", type=int, help="números dos slides (padrão: todos)")
    args = parser.parse_args()

    script = EXPORT_SCRIPT.format(source=to_windows_path(args.pptx.resolve()),
                                  slides=",".join(str(n) for n in args.slides))
    output = subprocess.check_output([POWERSHELL, "-NoProfile", "-Command", script], text=True)
    work_dir = to_wsl_path(output.strip().splitlines()[-1])

    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for png in sorted(work_dir.glob("slide*.png")):
        shutil.copy(png, PREVIEW_DIR / png.name)
        print(f"[DECK] {PREVIEW_DIR / png.name}")
    shutil.rmtree(work_dir, ignore_errors=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
