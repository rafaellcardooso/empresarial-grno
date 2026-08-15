"""Coleta docsIfCmtsCmStatusValue (MAC→status) nos CMTS via SNMP."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib.snmp_bsod import (
    OID_CM_MAC,
    _cm_index_from_oid_suffix,
    _oid_suffix_from_line,
    _parse_hex_string_payload,
    _snmp_parallel,
    snmp_walk_lines,
)
from lib.util import normalize_mac

logger = logging.getLogger(__name__)

# DOCS-IF-MIB — docsIfCmtsCmStatusValue (registration state)
OID_CM_STATUS_VALUE = "1.3.6.1.2.1.10.127.1.3.3.1.6"
CMTS_REG_OPERATIONAL = 8


def _parse_snmp_int_value(line: str) -> int | None:
    """Extrai inteiro da coluna direita de uma linha snmpwalk."""
    value = line.partition("=")[2].strip()
    if not value:
        return None
    token = value.split()[0]
    try:
        return int(token)
    except ValueError:
        return None


def collect_cmts_reg_status_map(host: str, community: str) -> dict[str, int]:
    """Mapa MAC normalizado → docsIfCmtsCmStatusValue para um CMTS."""
    mac_by_index: dict[int, str] = {}
    for line in snmp_walk_lines(host, OID_CM_MAC, community):
        suffix = _oid_suffix_from_line(line, OID_CM_MAC)
        cm_index = _cm_index_from_oid_suffix(suffix)
        if cm_index is None:
            continue
        raw = _parse_hex_string_payload(line)
        if raw is None:
            continue
        mac = normalize_mac(" ".join(f"{b:02x}" for b in raw))
        if mac:
            mac_by_index[cm_index] = mac

    result: dict[str, int] = {}
    for line in snmp_walk_lines(host, OID_CM_STATUS_VALUE, community):
        suffix = _oid_suffix_from_line(line, OID_CM_STATUS_VALUE)
        cm_index = _cm_index_from_oid_suffix(suffix)
        if cm_index is None:
            continue
        mac = mac_by_index.get(cm_index)
        if not mac:
            continue
        status = _parse_snmp_int_value(line)
        if status is not None:
            result[mac] = status
    return result


def collect_all_cmts_reg_status_maps(city: dict[str, Any]) -> dict[str, dict[str, int]]:
    """Coleta mapas MAC→status de registro de todos os CMTS da cidade."""
    community = city.get("snmp_community") or "public"
    jobs: list[tuple[str, str]] = []
    for cmts_name, meta in (city.get("cmts") or {}).items():
        if not isinstance(meta, dict):
            continue
        ip = (meta.get("ip") or "").strip()
        if not ip:
            continue
        jobs.append((cmts_name.upper(), ip))

    if not jobs:
        return {}

    maps: dict[str, dict[str, int]] = {}
    workers = min(_snmp_parallel(), len(jobs))
    logger.info("[%s] SNMP CMTS reg status cmts=%d parallel=%d", city.get("ope"), len(jobs), workers)

    def work(item: tuple[str, str]) -> tuple[str, dict[str, int]]:
        name, ip = item
        try:
            return name, collect_cmts_reg_status_map(ip, community)
        except Exception as exc:
            logger.exception("[%s] falha coleta reg status CMTS %s: %s", name, ip, exc)
            return name, {}

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(work, job): job[0] for job in jobs}
        for future in as_completed(futures):
            name, status_map = future.result()
            maps[name] = status_map
            if status_map:
                operational = sum(1 for v in status_map.values() if v == CMTS_REG_OPERATIONAL)
                logger.info(
                    "[%s] CMTS reg status %s modems=%d operational=%d",
                    city.get("ope"),
                    name,
                    len(status_map),
                    operational,
                )
    return maps
