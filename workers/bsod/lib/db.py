"""Persistência MySQL SIR das tabelas bsod_*."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable

import pymysql
from pymysql.cursors import DictCursor

from lib.config import get_sir_db_config

CABLE_UPSERT = """
INSERT INTO bsod_cables (
  ope, ddd, hostname_cmts, node, id_cable, mac, ip_ger, vendor, model,
  hw_ver, sw_ver, docsis_ver, d31_capable, ds_count, us_count,
  longitude, latitude, address, reg_status, last_update, chronic_days
) VALUES (
  %(ope)s, %(ddd)s, %(hostname_cmts)s, %(node)s, %(id_cable)s, %(mac)s, %(ip_ger)s,
  %(vendor)s, %(model)s, %(hw_ver)s, %(sw_ver)s, %(docsis_ver)s, %(d31_capable)s,
  %(ds_count)s, %(us_count)s, %(longitude)s, %(latitude)s, %(address)s,
  %(reg_status)s, %(last_update)s, %(chronic_days)s
)
ON DUPLICATE KEY UPDATE
  ddd = VALUES(ddd),
  hostname_cmts = VALUES(hostname_cmts),
  node = VALUES(node),
  id_cable = VALUES(id_cable),
  ip_ger = VALUES(ip_ger),
  vendor = VALUES(vendor),
  model = VALUES(model),
  hw_ver = VALUES(hw_ver),
  sw_ver = VALUES(sw_ver),
  docsis_ver = VALUES(docsis_ver),
  d31_capable = VALUES(d31_capable),
  ds_count = VALUES(ds_count),
  us_count = VALUES(us_count),
  longitude = VALUES(longitude),
  latitude = VALUES(latitude),
  address = VALUES(address),
  reg_status = VALUES(reg_status),
  last_update = VALUES(last_update),
  chronic_days = VALUES(chronic_days)
"""

INVENTORY_UPSERT = """
INSERT INTO bsod_inventory (
  ope, ddd, cmts, mac, id_cable, node, contrato, profile, address, bsod_vlan, vlan
) VALUES (
  %(ope)s, %(ddd)s, %(cmts)s, %(mac)s, %(id_cable)s, %(node)s, %(contrato)s,
  %(profile)s, %(address)s, %(bsod_vlan)s, %(vlan)s
)
ON DUPLICATE KEY UPDATE
  ddd = VALUES(ddd),
  cmts = VALUES(cmts),
  id_cable = VALUES(id_cable),
  node = VALUES(node),
  contrato = VALUES(contrato),
  profile = VALUES(profile),
  address = VALUES(address),
  bsod_vlan = VALUES(bsod_vlan),
  vlan = VALUES(vlan)
"""

MONITOR_INSERT = """
INSERT INTO bsod_monitor (ope, ddd, mac, status, tx, rx, mer, sampled_at)
VALUES (%(ope)s, %(ddd)s, %(mac)s, %(status)s, %(tx)s, %(rx)s, %(mer)s, %(sampled_at)s)
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


def upsert_cables(rows: Iterable[dict[str, Any]]) -> int:
    """Upsert em lote de cables; retorna quantidade enviada."""
    params_list = list(rows)
    if not params_list:
        return 0
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            for params in params_list:
                cursor.execute(CABLE_UPSERT, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    return len(params_list)


def insert_monitor_samples(rows: Iterable[dict[str, Any]]) -> int:
    """Insere amostras RF; retorna quantidade."""
    params_list = list(rows)
    if not params_list:
        return 0
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            for params in params_list:
                cursor.execute(MONITOR_INSERT, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    return len(params_list)


def upsert_inventory(rows: Iterable[dict[str, Any]]) -> int:
    """Upsert inventário PME/BSoD."""
    params_list = list(rows)
    if not params_list:
        return 0
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            for params in params_list:
                cursor.execute(INVENTORY_UPSERT, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    return len(params_list)


def list_cables_for_ope(ope: str) -> list[dict[str, Any]]:
    """Lista cables persistidos do ope."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM bsod_cables WHERE ope = %s",
                ((ope or "").strip().lower(),),
            )
            return list(cursor.fetchall())
    finally:
        conn.close()


def list_inventory_macs(ope: str) -> set[str]:
    """Conjunto de MACs do inventário (lower)."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT mac FROM bsod_inventory WHERE ope = %s",
                ((ope or "").strip().lower(),),
            )
            return {(row["mac"] or "").strip().lower() for row in cursor.fetchall()}
    finally:
        conn.close()


def cleanup_inventory_orphans(ope: str, keep_macs: set[str]) -> int:
    """Remove inventário do ope cujo MAC não está em keep_macs."""
    ope_key = (ope or "").strip().lower()
    conn = get_connection()
    deleted = 0
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, mac FROM bsod_inventory WHERE ope = %s", (ope_key,))
            rows = cursor.fetchall()
            for row in rows:
                mac = (row["mac"] or "").strip().lower()
                if mac and mac not in keep_macs:
                    cursor.execute("DELETE FROM bsod_inventory WHERE id = %s", (row["id"],))
                    deleted += 1
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    return deleted


def now_local() -> datetime:
    """Timestamp local para amostras."""
    return datetime.now()
