"""Números e datas da edição do deck GRNO: lê `snapshot.json` (gerado por `npm run deck:facts`) e formata os textos."""

from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

SNAPSHOT_PATH = Path(__file__).resolve().parent / "snapshot.json"
PROJECT_START_DAY = date(2026, 7, 21)
MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
          "novembro", "dezembro"]


def _load_snapshot() -> dict:
    """Lê o snapshot de produção; aborta com instrução de geração quando ausente."""
    if not SNAPSHOT_PATH.is_file():
        raise SystemExit(f"[DECK] Snapshot ausente: {SNAPSHOT_PATH} (gerar com npm run deck:facts em produção)")
    return json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))


def _thousands(value: int) -> str:
    """Formata inteiro com separador de milhar pt-BR (4.002)."""
    return f"{value:,}".replace(",", ".")


def _day_month(day: date) -> str:
    """Formata data como dd/mm."""
    return day.strftime("%d/%m")


def _long_day(day: date) -> str:
    """Formata data por extenso sem ano (5 de outubro)."""
    return f"{day.day} de {MONTHS[day.month - 1]}"


_snapshot = _load_snapshot()
_sir = _snapshot["sir"]
_sdh = _snapshot["sdh"]
_deliveries = _snapshot["deliveries"]
_snapshot_day = date.fromisoformat(_sir["periodTo"])
_top_ddd = _sir.get("topRalDdd") or {"label": "-", "total": 0}

SNAPSHOT_SOURCE = _snapshot["source"]
SNAPSHOT_DATE = _snapshot_day.strftime("%d/%m/%Y")
SNAPSHOT_DATE_LONG = _long_day(_snapshot_day)
SIR_PERIOD = f"{_day_month(date.fromisoformat(_sir['periodFrom']))} a {_day_month(_snapshot_day)}"

SIR_OPENED_TOTAL = _thousands(_sir["openedRal"] + _sir["openedRec"])
SIR_OPENED_RAL = _thousands(_sir["openedRal"])
SIR_OPENED_REC = _thousands(_sir["openedRec"])
SDH_ACTIVE_TOTAL = _thousands(_sdh["total"])
SDH_ACTIVE_BY_VENDOR = f"{_sdh['datacom']} Datacom, {_sdh['tellabs']} Tellabs e {_sdh['alcatel']} Alcatel"

SIR_BACKLOG_TOTAL = _thousands(_sir["backlogRal"] + _sir["backlogRec"])
SIR_BACKLOG_RAL = _thousands(_sir["backlogRal"])
SIR_BACKLOG_REC = _thousands(_sir["backlogRec"])
SIR_BACKLOG_OVER_3_DAYS = _thousands(_sir["backlogOver3Days"])
SIR_TOP_RAL_DDD = f"{_top_ddd['label']} ({_top_ddd['total']})"
SIR_TOP_RAL_DDD_CODE = _top_ddd["label"].split(" - ")[0]
SDH_LEADING_VENDOR = max([("Datacom", _sdh["datacom"]), ("Tellabs", _sdh["tellabs"]), ("Alcatel", _sdh["alcatel"])],
                         key=lambda item: item[1])[0]

PROJECT_START = _day_month(PROJECT_START_DAY)
PROJECT_START_LONG = _long_day(PROJECT_START_DAY)
PROJECT_WEEKS = str(math.ceil((_snapshot_day - PROJECT_START_DAY).days / 7))
DELIVERIES_TOTAL = _thousands(_deliveries["total"])
DELIVERIES_FEATURES = _thousands(_deliveries["features"])
DELIVERIES_FIXES = _thousands(_deliveries["fixes"])
BASELINE_WINDOW = "out a dez/2026"

VALIDATION_CIRCUIT = "MPA/IP/00691"
VALIDATION_BANDWIDTH = "155 Mbps"

STAKEHOLDERS = [
    "Gerente: Marcio Dyego Lima Tanaka",
    "Coordenador: Pedro Júnior Rodrigues dos Santos",
    "Desenvolvedor: Rafael Bezerra Cardoso",
    "Usuários: time Empresarial",
]
