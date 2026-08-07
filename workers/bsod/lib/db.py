"""Persistência MySQL SIR das tabelas bsod_*."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable

import pymysql
from pymysql.cursors import DictCursor

from lib.config import get_sir_db_config
from lib.util import normalize_contrato, normalize_mac, normalize_vlan

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
  ope, ddd, cmts, mac, id_cable, node, contrato, profile, cliente, cadastro_responsavel,
  designacao, produto, address, manual_override, bsod_vlan, vlan
) VALUES (
  %(ope)s, %(ddd)s, %(cmts)s, %(mac)s, %(id_cable)s, %(node)s, %(contrato)s,
  %(profile)s, %(cliente)s, %(cadastro_responsavel)s, %(designacao)s, %(produto)s,
  %(address)s, %(manual_override)s, %(bsod_vlan)s, %(vlan)s
)
ON DUPLICATE KEY UPDATE
  ddd = VALUES(ddd),
  cmts = VALUES(cmts),
  id_cable = VALUES(id_cable),
  node = VALUES(node),
  contrato = VALUES(contrato),
  profile = VALUES(profile),
  cliente = VALUES(cliente),
  cadastro_responsavel = VALUES(cadastro_responsavel),
  designacao = VALUES(designacao),
  produto = VALUES(produto),
  address = VALUES(address),
  manual_override = VALUES(manual_override),
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


def list_inventory_client_fields(ope: str) -> dict[str, dict[str, Any]]:
    """Mapa MAC normalizado → cliente/override já persistidos no inventário."""
    ope_key = (ope or "").strip().lower()
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT mac, cliente, cadastro_responsavel, designacao, address, manual_override
                FROM bsod_inventory
                WHERE ope = %s
                """,
                (ope_key,),
            )
            out: dict[str, dict[str, Any]] = {}
            for row in cursor.fetchall():
                key = normalize_mac(row.get("mac")) or str(row.get("mac") or "").strip().lower()
                if key:
                    out[key] = row
            return out
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


CRM_INSERT = """
INSERT INTO bsod_crm_clients (
  ope, protocolo, uf, svlan, cvlan, contrato_netsms, cadastro_responsavel, cliente, tipo_logradouro,
  logradouro, numero, complemento, bairro, cep,
  cidade, produto, designacao,
  contato_cliente_nome_1, contato_cliente_telefone_1,
  contato_cliente_nome_2, contato_cliente_telefone_2,
  contato_cliente_email_1, contato_cliente_email_2,
  contrato_conectado, construcao_data_execucao, cancelamento_data, cancelamento_motivo,
  synced_at
) VALUES (
  %(ope)s, %(protocolo)s, %(uf)s, %(svlan)s, %(cvlan)s, %(contrato_netsms)s,
  %(cadastro_responsavel)s, %(cliente)s,
  %(tipo_logradouro)s, %(logradouro)s, %(numero)s,
  %(complemento)s, %(bairro)s, %(cep)s, %(cidade)s, %(produto)s, %(designacao)s,
  %(contato_cliente_nome_1)s, %(contato_cliente_telefone_1)s,
  %(contato_cliente_nome_2)s, %(contato_cliente_telefone_2)s,
  %(contato_cliente_email_1)s, %(contato_cliente_email_2)s,
  %(contrato_conectado)s, %(construcao_data_execucao)s, %(cancelamento_data)s,
  %(cancelamento_motivo)s, %(synced_at)s
)
"""


def replace_crm_clients(ope: str, rows: Iterable[dict[str, Any]]) -> int:
    """Substitui o catálogo CRM do ope (delete + insert); retorna quantidade gravada."""
    ope_key = (ope or "").strip().lower()
    synced_at = now_local()
    params_list: list[dict[str, Any]] = []
    for raw in rows:
        protocolo = (raw.get("protocolo") or "").strip()
        if not protocolo:
            continue
        params_list.append(
            {
                "ope": ope_key,
                "protocolo": protocolo[:64],
                "uf": (raw.get("uf") or "")[:8],
                "svlan": (raw.get("svlan") or "")[:32],
                "cvlan": (raw.get("cvlan") or "")[:32],
                "contrato_netsms": (raw.get("contrato_netsms") or "")[:64],
                "cadastro_responsavel": (raw.get("cadastro_responsavel") or "")[:255],
                "cliente": (raw.get("cliente") or "")[:255],
                "tipo_logradouro": (raw.get("tipo_logradouro") or "")[:64],
                "logradouro": (raw.get("logradouro") or "")[:255],
                "numero": (raw.get("numero") or "")[:64],
                "complemento": (raw.get("complemento") or "")[:255],
                "bairro": (raw.get("bairro") or "")[:255],
                "cep": (raw.get("cep") or "")[:32],
                "cidade": (raw.get("cidade") or "")[:255],
                "produto": (raw.get("produto") or "")[:255],
                "designacao": (raw.get("designacao") or "")[:255],
                "contato_cliente_nome_1": (raw.get("contato_cliente_nome_1") or "")[:255],
                "contato_cliente_telefone_1": (raw.get("contato_cliente_telefone_1") or "")[:64],
                "contato_cliente_nome_2": (raw.get("contato_cliente_nome_2") or "")[:255],
                "contato_cliente_telefone_2": (raw.get("contato_cliente_telefone_2") or "")[:64],
                "contato_cliente_email_1": (raw.get("contato_cliente_email_1") or "")[:255],
                "contato_cliente_email_2": (raw.get("contato_cliente_email_2") or "")[:255],
                "contrato_conectado": (raw.get("contrato_conectado") or "")[:64],
                "construcao_data_execucao": (raw.get("construcao_data_execucao") or "")[:64],
                "cancelamento_data": (raw.get("cancelamento_data") or "")[:64],
                "cancelamento_motivo": (raw.get("cancelamento_motivo") or "")[:255],
                "synced_at": synced_at,
            }
        )

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM bsod_crm_clients WHERE ope = %s", (ope_key,))
            for params in params_list:
                cursor.execute(CRM_INSERT, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    return len(params_list)


def list_crm_by_contrato(ope: str) -> dict[str, dict[str, Any]]:
    """Mapa contrato_netsms → linha CRM (join inventário via contrato LDAP)."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT protocolo, contrato_netsms, cvlan, uf, svlan, cadastro_responsavel, cliente,
                       designacao, tipo_logradouro, logradouro, numero, complemento, bairro, cep, cidade
                FROM bsod_crm_clients
                WHERE ope = %s AND contrato_netsms <> ''
                """,
                ((ope or "").strip().lower(),),
            )
            out: dict[str, dict[str, Any]] = {}
            for row in cursor.fetchall():
                key = normalize_contrato(row.get("contrato_netsms"))
                if key:
                    out[key] = row
            return out
    finally:
        conn.close()


def list_crm_by_cvlan(ope: str) -> dict[str, dict[str, Any]]:
    """Mapa cvlan → CRM só quando a cvlan é única no ope e diferente de 0."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT protocolo, contrato_netsms, cvlan, uf, svlan, cadastro_responsavel, cliente,
                       designacao, tipo_logradouro, logradouro, numero, complemento, bairro, cep, cidade
                FROM bsod_crm_clients
                WHERE ope = %s AND cvlan <> ''
                """,
                ((ope or "").strip().lower(),),
            )
            buckets: dict[str, list[dict[str, Any]]] = {}
            for row in cursor.fetchall():
                key = normalize_vlan(row.get("cvlan"))
                if not key or key == "0":
                    continue
                buckets.setdefault(key, []).append(row)
            return {key: rows[0] for key, rows in buckets.items() if len(rows) == 1}
    finally:
        conn.close()


def list_crm_cvlans(ope: str) -> set[str]:
    """Conjunto de cvlan numéricas do catálogo CRM do ope."""
    return set(list_crm_by_cvlan(ope).keys())


def now_local() -> datetime:
    """Timestamp local para amostras."""
    return datetime.now()
