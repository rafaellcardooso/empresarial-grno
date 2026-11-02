"""Persistência MySQL SIR da planta instalada (`tbl_planta_instalada`)."""

from __future__ import annotations

from datetime import datetime
from typing import Sequence

import pymysql

from lib.config import get_sir_db_config
from lib.source import PLANTA_COLUMNS

BATCH_SIZE = 1000

DELETE_SQL = "DELETE FROM tbl_planta_instalada"

INSERT_SQL = (
    f"INSERT INTO tbl_planta_instalada ({', '.join(PLANTA_COLUMNS)}, synced_at) "
    f"VALUES ({', '.join(['%s'] * (len(PLANTA_COLUMNS) + 1))})"
)


def get_connection() -> pymysql.connections.Connection:
    """Abre conexão MySQL SIR sem autocommit."""
    cfg = get_sir_db_config()
    return pymysql.connect(**cfg, autocommit=False)


def replace_planta_rows(rows: Sequence[tuple[str | None, ...]]) -> int:
    """Substitui todo o conteúdo de `tbl_planta_instalada` pelas linhas informadas.

    DELETE + INSERT em lotes numa única transação: leitores veem o snapshot anterior até o
    commit e qualquer falha faz rollback sem alterar a tabela. Retorna linhas gravadas.
    """
    if not rows:
        raise RuntimeError("Nenhuma linha da origem para gravar — sincronização abortada")

    synced_at = datetime.now()
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(DELETE_SQL)
            for start in range(0, len(rows), BATCH_SIZE):
                batch = [(*row, synced_at) for row in rows[start : start + BATCH_SIZE]]
                cursor.executemany(INSERT_SQL, batch)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return len(rows)
