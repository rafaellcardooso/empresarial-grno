"""Leitura da origem `planta_instalada` no MySQL Terminal (somente leitura)."""

from __future__ import annotations

from typing import Any

import pymysql
from pymysql.cursors import SSCursor

from lib.config import get_terminal_db_config

PLANTA_COLUMNS = (
    "designacao_circuito",
    "razao_social",
    "num_pta",
    "cep_pta",
    "velocidade",
    "risco_multa",
    "estacao_entrega_acesso",
    "descr_acesso_ponta",
)

SELECT_SQL = f"SELECT {', '.join(PLANTA_COLUMNS)} FROM planta_instalada"


def _nullable(value: Any) -> str | None:
    """Normaliza valor da origem em texto aparado; vazio vira None."""
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def fetch_planta_rows() -> list[tuple[str | None, ...]]:
    """Lê todas as linhas de `planta_instalada` via cursor de streaming e normaliza os valores."""
    cfg = get_terminal_db_config()
    conn = pymysql.connect(
        **cfg,
        cursorclass=SSCursor,
        connect_timeout=15,
        read_timeout=600,
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(SELECT_SQL)
            return [tuple(_nullable(value) for value in row) for row in cursor]
    finally:
        conn.close()
