"""Paleta, fonte e geometria padrão das apresentações gerenciais (template Claro 16:9)."""

from __future__ import annotations

from pathlib import Path

PRESENTATION_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PRESENTATION_ROOT / "assets"
TEMPLATE_PATH = ASSETS_DIR / "claro-template.pptx"
LOGO_PATH = ASSETS_DIR / "claro-logo.png"

NAVY = "1A2744"
NAVY2 = "2C3E80"
RED = "C00000"
TEAL = "0E7490"
GREEN = "126B3A"
ORANGE = "F97316"
BLUE = "3B82F6"
BODY = "3B4652"
MUTED = "64748B"
LINE = "D7DEE8"
SOFT = "F1F5F9"
WARM = "FFF4EC"
WHITE = "FFFFFF"
FONT = "Aptos"

SLIDE_WIDTH = 12192000
MARGIN_X = 594360
CONTENT_WIDTH = SLIDE_WIDTH - 2 * MARGIN_X
CONTENT_TOP = 1830000
FOOTER_TOP = 5739816

GAP = 228600
GAP_SMALL = 91440
ACCENT_BAR = 54864

LOGO_BOX = (10939636, 5822376, 945102, 852854)
TEMPLATE_BLANK_LAYOUT = 11
