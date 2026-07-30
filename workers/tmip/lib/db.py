"""Persistência MySQL de alarmes SDH (`sdh_alarms`)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable

import pymysql
from pymysql.cursors import DictCursor

from lib.config import get_sir_db_config

UPSERT_SQL = """
INSERT INTO sdh_alarms (
  id, gerencia, ne, porta, uf, municipio, ddd, circuito, alarme, data_alarme, sir, ip,
  is_active, first_seen_at, last_seen_at
) VALUES (
  %(id)s, %(gerencia)s, %(ne)s, %(porta)s, %(uf)s, %(municipio)s, %(ddd)s, %(circuito)s,
  %(alarme)s, %(data_alarme)s, %(sir)s, %(ip)s,
  1, %(now)s, %(now)s
)
ON DUPLICATE KEY UPDATE
  gerencia = VALUES(gerencia),
  ne = VALUES(ne),
  porta = VALUES(porta),
  uf = VALUES(uf),
  municipio = VALUES(municipio),
  ddd = VALUES(ddd),
  circuito = VALUES(circuito),
  alarme = VALUES(alarme),
  data_alarme = VALUES(data_alarme),
  sir = VALUES(sir),
  ip = VALUES(ip),
  is_active = 1,
  last_seen_at = VALUES(last_seen_at)
"""

CLOSE_MISSING_SQL = """
UPDATE sdh_alarms
SET is_active = 0
WHERE is_active = 1
  AND id NOT IN ({placeholders})
"""


def get_connection() -> pymysql.connections.Connection:
    """Abre conexão MySQL SIR com cursor dict."""
    cfg = get_sir_db_config()
    return pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        charset=cfg["charset"],
        cursorclass=DictCursor,
        autocommit=False,
    )


def _nullable(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _parse_alarm_dt(value: Any) -> datetime | None:
    text = _nullable(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def row_to_params(row: dict[str, Any], now: datetime) -> dict[str, Any]:
    """Converte linha do CSV em parâmetros do upsert."""
    return {
        "id": int(str(row["id"]).strip()),
        "gerencia": _nullable(row.get("gerencia")),
        "ne": _nullable(row.get("ne")),
        "porta": _nullable(row.get("porta")),
        "uf": _nullable(row.get("uf")),
        "municipio": _nullable(row.get("municipio")),
        "ddd": _nullable(row.get("DDD")),
        "circuito": _nullable(row.get("circuito")),
        "alarme": _nullable(row.get("alarme")),
        "data_alarme": _parse_alarm_dt(row.get("data_alarme")),
        "sir": _nullable(row.get("sir")),
        "ip": _nullable(row.get("ip")),
        "now": now,
    }


def upsert_sdh_rows(rows: Iterable[dict[str, Any]]) -> tuple[int, list[int]]:
    """Faz upsert dos alarmes presentes no scrape e desativa ausentes.

    Retorna (quantidade upserted, ids ativos no scrape).
    """
    now = datetime.now()
    params_list = [row_to_params(row, now) for row in rows]
    active_ids = [item["id"] for item in params_list]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            for params in params_list:
                cursor.execute(UPSERT_SQL, params)

            if active_ids:
                placeholders = ", ".join(["%s"] * len(active_ids))
                cursor.execute(CLOSE_MISSING_SQL.format(placeholders=placeholders), active_ids)
            else:
                cursor.execute("UPDATE sdh_alarms SET is_active = 0 WHERE is_active = 1")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return len(params_list), active_ids
