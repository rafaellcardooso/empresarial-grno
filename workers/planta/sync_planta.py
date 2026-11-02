#!/usr/bin/env python3
"""Copia `db_planta.planta_instalada` para `tbl_planta_instalada` (MySQL SIR)."""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import load_worker_env
from lib.db import replace_planta_rows
from lib.source import fetch_planta_rows

LOG_PREFIX = "[PLANTA]"


def _count_duplicate_designations(rows: list[tuple[str | None, ...]]) -> int:
    """Conta designações de circuito que aparecem mais de uma vez na origem."""
    counts = Counter(row[0] for row in rows if row[0])
    return sum(1 for total in counts.values() if total > 1)


def main() -> int:
    """Executa um ciclo de sincronização (leitura da origem + substituição no SIR)."""
    load_worker_env()
    print(f"{LOG_PREFIX} Lendo planta_instalada na origem")
    rows = fetch_planta_rows()
    duplicates = _count_duplicate_designations(rows)
    print(f"{LOG_PREFIX} Origem: {len(rows)} linhas; designações repetidas: {duplicates}")

    written = replace_planta_rows(rows)
    print(f"{LOG_PREFIX} tbl_planta_instalada substituída com {written} linhas")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 — entry point operacional
        print(f"{LOG_PREFIX} Erro: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
